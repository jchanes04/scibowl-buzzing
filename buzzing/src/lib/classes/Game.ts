import { createGameID, createMemberID } from "$lib/functions/createId"
import { subscribeToGame, unsubscribeFromGame, getMemberFromCache, type CachedMember, getTeamFromCache, getAllTeamsFromCache, type CachedTeam } from "$lib/server/gameMemberCache"
import type { ConvexClient } from "$lib/convex.server"
import { api } from "../../convex/_generated/api"

export type Category = 'earth' | 'bio' | 'chem' | 'physics' | 'math' | 'energy'

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

export type ScoreType = "correct" | "incorrect" | "penalty"

type BuzzedState = {
    questionState: 'buzzed'
    currentBuzzerId: string,
    currentQuestion: Question
    buzzedTeamIds: Record<string, boolean>
}

type IdleState = {
    questionState: 'idle'
    currentBuzzerId: null,
    currentQuestion: null
    buzzedTeamIds: Record<string, boolean>
}

type OpenState = {
    questionState: 'open'
    currentBuzzerId: null,
    currentQuestion: Question
    buzzedTeamIds: Record<string, boolean>,
}

export interface Game {
    id: string,
    joinCode: string,
    name: string,

    spectators: Set<string>

    lastActive: number,

    state: IdleState | OpenState | BuzzedState

    // Convex client for querying game data
    convexClient: ConvexClient
}

type GameParameters = {
    name: string,
    joinCode: string,
    convexClient: ConvexClient
}

export class Game {
    constructor({ name, joinCode, convexClient }: GameParameters) {
        this.id = createGameID()
        this.joinCode = joinCode.toUpperCase()  // Easier way to join games than a url with a 7 or 8 character ID

        this.name = name

        this.spectators = new Set()

        this.lastActive = Date.now()

        this.convexClient = convexClient

        /*
            idle: no question opened, nobody can buzz
            open: a question has been opened and players can buzz in
            buzzed: a player has buzzed and their answer has not been scored
        */
        this.state = {
            questionState: 'idle',
            currentBuzzerId: null,        // the player id that has buzzed in
            currentQuestion: null,      // the current question information (category, is bonus)
            buzzedTeamIds: {}    // the team ids who have buzzed, prevents different players on the same team from buzzing again
        }

        // Subscribe to Convex for real-time member updates
        subscribeToGame(this.id)
    }

    /**
     * Get game data from Convex (settings, times, scoreboard, timers)
     */
    async getGameData() {
        return await this.convexClient.query(api.games.get, { gameId: this.id })
    }

    /**
     * Get member from Convex cache (for fast validation like buzz checks)
     * Returns null if member not found in cache
     */
    getCachedMember(memberId: string): CachedMember | null {
        return getMemberFromCache(this.id, memberId)
    }

    /**
     * Get team from Convex cache
     * Returns null if team not found in cache
     */
    getCachedTeam(teamId: string): CachedTeam | null {
        return getTeamFromCache(this.id, teamId)
    }

    /**
     * Get all teams from Convex cache
     */
    getAllCachedTeams(): CachedTeam[] {
        return getAllTeamsFromCache(this.id)
    }

    /**
     * Calculate remaining time for question timer (in seconds)
     */
    async getQuestionTimerRemaining(): Promise<number> {
        const gameData = await this.getGameData()
        if (!gameData?.questionTimerStartTime || !gameData?.questionTimerDuration) {
            return 0
        }
        const elapsed = (Date.now() - gameData.questionTimerStartTime) / 1000
        return Math.max(0, Math.floor(gameData.questionTimerDuration - elapsed))
    }

    /**
     * Calculate remaining time for game clock (in seconds)
     */
    async getGameClockRemaining(): Promise<number> {
        const gameData = await this.getGameData()
        if (!gameData?.gameClockStartTime || !gameData?.gameClockDuration) {
            return 0
        }
        const elapsed = (Date.now() - gameData.gameClockStartTime) / 1000
        return Math.max(0, Math.floor(gameData.gameClockDuration - elapsed))
    }

    /**
     * Unsubscribe from Convex updates (call when game ends)
     */
    cleanup(): void {
        unsubscribeFromGame(this.id)
    }

    buzz(id: string) {
        const member = this.getCachedMember(id)
        if (!member || member.type !== 'player' || !member.teamId) {
            return null
        }

        // Check if player's team has already buzzed
        if (this.state.buzzedTeamIds[member.teamId]) {
            return null
        }

        // Add team to buzzed teams and set current buzzer
        this.state.buzzedTeamIds[member.teamId] = true
        this.state.currentBuzzerId = id
        this.state.questionState = 'buzzed'

        return {
            playerId: id,
            playerName: member.name,
            teamId: member.teamId
        }
    }

    newQuestion(question: NewQuestionData) {
        if (!question) return false

        // For bonus questions, validate team exists
        if (question.bonus) {
            const team = this.getCachedTeam(question.teamId)
            if (!team) return false
        }

        this.state.questionState = 'open'
        this.state.currentBuzzerId = null
        this.state.buzzedTeamIds = {}

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

        // For tossup: must be buzzed state with a buzzer
        // For bonus: no buzzer needed
        if (
            (this.state.questionState !== "buzzed" || !this.state.currentBuzzerId)
            && !currentQuestion.bonus
        ) return null

        const buzzerId = this.state.currentBuzzerId
        const buzzer = buzzerId ? this.getCachedMember(buzzerId) : null
        const bonus = this.state.currentQuestion.bonus
        const teamId = currentQuestion.bonus ? currentQuestion.teamId : buzzer?.teamId

        if (!teamId) return null

        // Determine if question should stay open
        // Open if: tossup, less than 3 teams have buzzed (or all teams), and answer was not correct
        const allTeams = this.getAllCachedTeams()
        const open = !bonus
            && Object.keys(this.state.buzzedTeamIds).length < Math.min(3, allTeams.length)
            && score !== 'correct'

        const buzzedTeamIds = this.state.buzzedTeamIds
        if (!open) {
            this.state = {
                questionState: "idle",
                currentBuzzerId: null,
                currentQuestion: null,
                buzzedTeamIds: {}
            }
        } else {
            this.state = {
                questionState: "open",
                currentBuzzerId: null,
                currentQuestion,
                buzzedTeamIds
            }
        }

        return {
            buzzer: buzzer ? { id: buzzerId!, name: buzzer.name } : null,
            teamId,
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
            currentBuzzerId: null,
            currentQuestion: null,
            buzzedTeamIds: {}
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
