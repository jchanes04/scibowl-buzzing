import { Timer } from "./Timer"
import { convex, convexSubscription } from "$lib/convexClient"
import { api } from "../../../convex/_generated/api"

export type Category = 'earth' | 'bio' | 'chem' | 'physics' | 'math' | 'energy'

// Simplified Question type - no Team object, just teamId
export type Question = {
    bonus: false,
    category: Category
    number: number
} | {
    bonus: true,
    category: Category,
    teamId: string,
    number: number,
    visual?: boolean
}

export type LastScoredQuestion = {
    number: number,
    bonus: boolean
}

export type NewQuestionData = {
    bonus: false,
    category: Category
    number: number
} | {
    bonus: true,
    category: Category,
    teamId: string,
    number: number,
    visual?: boolean
}

export type GameSettings = {
    individualsAllowed: boolean,
    newTeamsAllowed: boolean,
    spectatorsAllowed: boolean
}

// Simplified buzzer type - just id and teamId
type BuzzerInfo = {
    id: string,
    teamId: string
}

type BuzzedState = {
    questionState: 'buzzed'
    currentBuzzer: BuzzerInfo,
    currentQuestion: Question
    buzzedTeams: Record<string, boolean>  // teamId -> true (just tracking which teams buzzed)
}

type IdleState = {
    questionState: 'idle'
    currentBuzzer: null,
    currentQuestion: null
    buzzedTeams: Record<string, boolean>
}

type OpenState = {
    questionState: 'open'
    currentBuzzer: null,
    currentQuestion: Question
    buzzedTeams: Record<string, boolean>,
}

export type ScoreType = "correct" | "incorrect" | "penalty"

export type GameTimes = {
    tossup?: [number, number],
    bonus?: [number, number],
    visual?: [number, number]
}

type GameParameters = {
    name: string,
    settings?: Partial<GameSettings>,
    joinCode: string,
    times?: GameTimes,
    id: string
}

export class Game {
    id: string
    joinCode: string
    name: string
    settings: GameSettings
    timer: Timer
    gameClock: Timer
    times: {
        tossup: [number, number],
        bonus: [number, number],
        visual: [number, number]
    }
    lastActive: number
    state: IdleState | OpenState | BuzzedState

    // Reactively updated via Convex subscriptions (for fast buzz validation)
    playerTeams: Map<string, string> = new Map()  // playerId -> teamId
    moderatorIds: Set<string> = new Set()
    teamCount: number = 0  // Track number of teams for scoring logic

    // Subscription cleanup functions
    private subscriptions: Array<() => void> = []

    get currentGameState() {
        return {
            questionState: this.state.questionState,
            currentBuzzer: this.state.currentBuzzer,
            currentQuestion: this.state.currentQuestion,
            buzzedTeamIds: Object.keys(this.state.buzzedTeams)
        }
    }

    constructor({ name, settings, joinCode, times, id }: GameParameters) {
        this.id = id
        this.joinCode = joinCode.toUpperCase()
        this.name = name

        this.settings = {
            individualsAllowed: settings?.individualsAllowed ?? false,
            newTeamsAllowed: settings?.newTeamsAllowed ?? true,
            spectatorsAllowed: settings?.spectatorsAllowed ?? false
        }

        this.timer = new Timer()
        this.gameClock = new Timer()
        this.times = {
            tossup: times?.tossup || [5, 2],
            bonus: times?.bonus || [20, 2],
            visual: times?.visual || [30, 2]
        }
        this.lastActive = Date.now()

        this.state = {
            questionState: 'idle',
            currentBuzzer: null,
            currentQuestion: null,
            buzzedTeams: {}
        }
    }

    /**
     * Set up Convex subscriptions to reactively sync player/team/moderator data.
     * This keeps the local cache updated without querying on every buzz.
     */
    setupSubscriptions() {
        // Subscribe to players - update playerTeams map
        const unsubPlayers = convexSubscription.onUpdate(
            api.players.getByGameId,
            { gameId: this.id },
            (players) => {
                this.playerTeams.clear()
                if (players) {
                    for (const p of players) {
                        // Only include connected players in the buzz-able list
                        if (p.connected && p.teamId) {
                            this.playerTeams.set(p.externalId, p.teamId)
                        }
                    }
                }
                console.log(`[Game ${this.id}] Players cache updated: ${this.playerTeams.size} players`)
            }
        )

        // Subscribe to moderators - update moderatorIds set
        const unsubModerators = convexSubscription.onUpdate(
            api.moderators.getByGameId,
            { gameId: this.id },
            (moderators) => {
                this.moderatorIds.clear()
                if (moderators) {
                    for (const m of moderators) {
                        if (m.connected) {
                            this.moderatorIds.add(m.externalId)
                        }
                    }
                }
                console.log(`[Game ${this.id}] Moderators cache updated: ${this.moderatorIds.size} moderators`)
            }
        )

        // Subscribe to teams - just track count for scoring logic
        const unsubTeams = convexSubscription.onUpdate(
            api.teams.getByGameId,
            { gameId: this.id },
            (teams) => {
                this.teamCount = teams?.length ?? 0
                console.log(`[Game ${this.id}] Teams cache updated: ${this.teamCount} teams`)
            }
        )

        this.subscriptions = [unsubPlayers, unsubModerators, unsubTeams]
    }

    /**
     * Clean up subscriptions and timers when game ends.
     */
    cleanup() {
        for (const unsub of this.subscriptions) {
            unsub()
        }
        this.subscriptions = []
        this.timer.end()
        this.gameClock.end()
    }

    /**
     * Check if a member is a player (for buzz validation)
     */
    isPlayer(memberId: string): boolean {
        return this.playerTeams.has(memberId)
    }

    /**
     * Check if a member is a moderator (for permission checks)
     */
    isModerator(memberId: string): boolean {
        return this.moderatorIds.has(memberId)
    }

    /**
     * Check if a member exists in the game (player or moderator)
     */
    hasMember(memberId: string): boolean {
        return this.isPlayer(memberId) || this.isModerator(memberId)
    }

    /**
     * Process a buzz attempt. Uses cached playerTeams for fast validation.
     * Returns the buzzer info if successful, null if failed.
     */
    buzz(playerId: string): BuzzerInfo | null {
        // Get player's team from cache
        const teamId = this.playerTeams.get(playerId)
        if (!teamId) {
            return null  // Player not found or disconnected
        }

        // Check if team already buzzed
        if (this.state.buzzedTeams[teamId]) {
            return null  // Team already buzzed
        }

        // Record the buzz
        this.state.buzzedTeams[teamId] = true
        const buzzerInfo: BuzzerInfo = { id: playerId, teamId }
        this.state.currentBuzzer = buzzerInfo
        this.state.questionState = 'buzzed'

        // Log to chat (async, not on critical path)
        convex.mutation(api.chatMessages.send, {
            gameId: this.id as any,
            type: "buzz",
            text: `Player buzzed`  // Player name will be looked up by client
        }).catch(console.error)

        return buzzerInfo
    }

    /**
     * Open a new question (tossup or bonus)
     */
    newQuestion(question: NewQuestionData): boolean {
        if (!question) return false

        this.state.questionState = 'open'
        this.state.currentBuzzer = null
        this.state.buzzedTeams = {}

        if (question.bonus) {
            this.state.currentQuestion = {
                category: question.category,
                bonus: true,
                visual: question.visual,
                teamId: question.teamId,
                number: question.number
            }
        } else {
            this.state.currentQuestion = {
                category: question.category,
                bonus: false,
                number: question.number
            }
        }

        return true
    }

    /**
     * Score the current question and determine if it stays open.
     */
    scoreQuestion(score: 'correct' | 'incorrect' | 'penalty') {
        if (!this.state.currentQuestion?.number) return null
        const currentQuestion = this.state.currentQuestion

        if (
            (this.state.questionState !== "buzzed" || !this.state.currentBuzzer)
            && !currentQuestion.bonus
        ) return null

        const buzzer = this.state.currentBuzzer
        const number = this.state.currentQuestion.number
        const bonus = this.state.currentQuestion.bonus
        const teamId = currentQuestion.bonus ? currentQuestion.teamId : buzzer!.teamId
        if (!bonus && !buzzer) return null

        // Question stays open if: not a bonus, not all teams have buzzed, and not correct
        const buzzedTeamCount = Object.keys(this.state.buzzedTeams).length
        const open = !bonus
            && buzzedTeamCount < Math.min(3, this.teamCount)
            && score !== 'correct'

        const buzzedTeams = this.state.buzzedTeams
        if (!open) {
            this.state = {
                questionState: "idle",
                currentBuzzer: null,
                currentQuestion: null,
                buzzedTeams: {}
            }
        } else {
            this.state = {
                questionState: "open",
                currentBuzzer: null,
                currentQuestion,
                buzzedTeams
            }
        }

        return {
            buzzer,
            teamId,
            open,
            category: currentQuestion.category,
            number,
            bonus
        }
    }

    /**
     * Mark the current question as dead (no one answered correctly)
     */
    markDead() {
        if (!this.state.currentQuestion) return null
        const number = this.state.currentQuestion.number
        const category = this.state.currentQuestion.category

        this.state = {
            questionState: "idle",
            currentBuzzer: null,
            currentQuestion: null,
            buzzedTeams: {}
        }

        return {
            number,
            category
        }
    }
}
