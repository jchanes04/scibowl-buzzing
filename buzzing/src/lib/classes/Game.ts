import { createGameID, createMemberID } from "$lib/functions/createId"
import { GameScoreboard } from "./GameScoreboard"
import type { PlayerData } from "./Player"
import type { ModeratorData } from "./Moderator"
import type { ScoreboardData } from "./Scoreboard"
import type { TeamData } from "./Team"
import { Team } from "./Team"
import { Timer } from "./Timer"
import {
    subscribeToGame,
    getPlayersFromCache,
    getModeratorsFromCache,
    getTeamsFromCache,
    getMemberFromCache,
    getTeamFromCache,
    type CachedMember,
    type CachedTeam
} from "$lib/server/gameMemberCache"

export type Category = 'earth' | 'bio' | 'chem' | 'physics' | 'math' | 'energy'

// Simplified question type - uses teamId instead of Team object
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

export type GameScores = {
    id: string,
    name: string,
    teams: Record<string, Omit<ScoreboardData, 'teamScoreboard'>>,
    players: Record<string, Omit<ScoreboardData, 'teamScoreboard'>>
}

// Simplified buzzer data - just the info we need for state
export type BuzzerData = {
    id: string,
    name: string,
    teamId: string
}

type BuzzedState = {
    questionState: 'buzzed'
    currentBuzzer: BuzzerData,
    currentQuestion: Question
    buzzedTeamIds: Set<string>
}

type IdleState = {
    questionState: 'idle'
    currentBuzzer: null,
    currentQuestion: null
    buzzedTeamIds: Set<string>
}

type OpenState = {
    questionState: 'open'
    currentBuzzer: null,
    currentQuestion: Question
    buzzedTeamIds: Set<string>,
}

export type ScoreType = "correct" | "incorrect" | "penalty"

// Legacy types kept for compatibility with page.server.ts data
export type LeftPlayerData = PlayerData & { team?: TeamData & { type: "created" } }

export type GameTimes = {
    tossup?: [number, number],
    bonus?: [number, number],
    visual?: [number, number]
}

type GameParameters = {
    name: string,
    settings?: Partial<GameSettings>,
    teamNames: string[],
    ownerId: string,
    ownerName: string,
    joinCode: string,
    times?: GameTimes
}

export class Game {
    id: string
    joinCode: string
    name: string

    spectators: Set<string>
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

    constructor({ name, settings, teamNames, ownerId, ownerName, joinCode, times }: GameParameters) {
        this.id = createGameID()
        this.joinCode = joinCode.toUpperCase()

        this.name = name
        
        this.spectators = new Set()
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
            buzzedTeamIds: new Set()
        }

        // Subscribe to Convex for this game's members and teams
        subscribeToGame(this.id)
    }

    // Getters that pull from Convex cache
    get players(): Record<string, CachedMember> {
        return getPlayersFromCache(this.id)
    }

    get moderators(): Record<string, CachedMember> {
        return getModeratorsFromCache(this.id)
    }

    get teams(): Record<string, CachedTeam> {
        return getTeamsFromCache(this.id)
    }

    get people(): Record<string, CachedMember> {
        return {
            ...this.players,
            ...this.moderators
        }
    }

    // Get a specific member from cache
    getMember(id: string): CachedMember | null {
        return getMemberFromCache(this.id, id)
    }

    // Get a specific team from cache
    getTeam(id: string): CachedTeam | null {
        return getTeamFromCache(this.id, id)
    }

    buzz(playerId: string): BuzzerData | null {
        const player = this.players[playerId]
        if (!player || !player.teamId) return null

        // Check if team has already buzzed
        if (this.state.buzzedTeamIds.has(player.teamId)) {
            return null
        }

        // Record the buzz
        this.state.buzzedTeamIds.add(player.teamId)

        const buzzerData: BuzzerData = {
            id: player.id,
            name: player.name,
            teamId: player.teamId
        }

        this.state.currentBuzzer = buzzerData
        this.state.questionState = 'buzzed'

        return buzzerData
    }

    newQuestion(question: NewQuestionData) {
        if (!question) return

        // For bonus questions, verify the team exists
        if (question.bonus && !this.teams[question.teamId]) return

        this.state.questionState = 'open'
        this.state.currentBuzzer = null
        this.state.buzzedTeamIds = new Set()

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

    scoreQuestion(score: 'correct' | 'incorrect' | 'penalty') {
        if (!this.state.currentQuestion?.number) return null
        const currentQuestion = this.state.currentQuestion

        if (
            (this.state.questionState !== "buzzed" || !this.state.currentBuzzer)
            && !currentQuestion.bonus
        ) return null

        const buzzer = this.state.currentBuzzer
        const bonus = this.state.currentQuestion.bonus
        const teamId = currentQuestion.bonus ? currentQuestion.teamId : buzzer!.teamId
        const team = this.teams[teamId]

        const open = !bonus
            && this.state.buzzedTeamIds.size < Math.min(3, Object.keys(this.teams).length)
            && score !== 'correct'

        const buzzedTeamIds = this.state.buzzedTeamIds
        if (!open) {
            this.state = {
                questionState: "idle",
                currentBuzzer: null,
                currentQuestion: null,
                buzzedTeamIds: new Set()
            }
        } else {
            this.state = {
                questionState: "open",
                currentBuzzer: null,
                currentQuestion,
                buzzedTeamIds
            }
        }

        return {
            buzzer,
            teamId,
            teamName: team?.name,
            open,
            category: currentQuestion.category,
            number: currentQuestion.number,
            bonus
        }
    }

    markDead() {
        if (!this.state.currentQuestion) return null
        const number = this.state.currentQuestion.number
        const category = this.state.currentQuestion.category

        this.state = {
            questionState: "idle",
            currentBuzzer: null,
            currentQuestion: null,
            buzzedTeamIds: new Set()
        }

        return {
            number,
            category
        }
    }


    addSpectator() {
        const newId = createMemberID()
        this.spectators.add(newId)
        return newId
    }

    removeSpectator(id: string) {
        return this.spectators.delete(id)
    }
}
