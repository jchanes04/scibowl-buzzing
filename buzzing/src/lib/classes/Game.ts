import { createGameID } from "$lib/functions/createId"
import { Timer } from "./Timer"
import type { Member, Team } from "$lib/types/members"

export type { Member as CachedMember, Team as CachedTeam }

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


export type GameSettings = {
    individualsAllowed: boolean,
    newTeamsAllowed: boolean,
    spectatorsAllowed: boolean
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

export type ScoreType = "correct" | "incorrect" | "penalty" | "subbed"

export type GameTimes = {
    tossup?: [number, number],
    bonus?: [number, number],
    visual?: [number, number]
}

export type ChatMessage = {
    text: string
    type: 'buzz' | 'notification' | 'warning' | 'success'
    target?: string[]
    timestamp: number
}

type GameParameters = {
    name: string,
    settings?: Partial<GameSettings>,
    teamNames: string[],
    ownerId: string,
    ownerName: string,
    joinCode: string,
    times?: GameTimes,
    existingId?: string
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

    chatMessages: ChatMessage[] = []

    // In-memory member/team storage (socket-authoritative)
    private _members: Record<string, Member> = {}
    private _teams: Record<string, Team> = {}

    constructor({ name, settings, teamNames, ownerId, ownerName, joinCode, times, existingId }: GameParameters) {
        this.id = existingId || createGameID()
        this.joinCode = joinCode.toUpperCase()

        this.name = name

        this.settings = {
            individualsAllowed: settings?.individualsAllowed ?? false,
            newTeamsAllowed: settings?.newTeamsAllowed ?? false,
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
    }

    // Getters that read from local in-memory state
    get players(): Record<string, Member> {
        const result: Record<string, Member> = {}
        for (const [id, member] of Object.entries(this._members)) {
            if (member.type === "player") {
                result[id] = member
            }
        }
        return result
    }

    get moderators(): Record<string, Member> {
        const result: Record<string, Member> = {}
        for (const [id, member] of Object.entries(this._members)) {
            if (member.type === "moderator") {
                result[id] = member
            }
        }
        return result
    }

    get teams(): Record<string, Team> {
        return this._teams
    }

    get members(): Record<string, Member> {
        return this._members
    }

    // Get a specific member
    getMember(id: string): Member | null {
        return this._members[id] ?? null
    }

    // Get a specific team
    getTeam(id: string): Team | null {
        return this._teams[id] ?? null
    }

    // Mutation methods for members
    addMember(member: Member): void {
        this._members[member.id] = member
    }

    removeMember(id: string): void {
        delete this._members[id]
    }

    promoteMember(id: string): void {
        const member = this._members[id]
        if (member) {
            member.type = "moderator"
            delete member.teamId
            delete member.isSubbed
        }
    }

    renameMember(id: string, name: string): void {
        const member = this._members[id]
        if (member) {
            member.name = name
        }
    }

    setMemberActive(id: string, isActive: boolean): void {
        const member = this._members[id]
        if (member) {
            member.isActive = isActive
        }
    }

    setMemberSubbed(id: string, isSubbed: boolean): void {
        const member = this._members[id]
        if (member) {
            member.isSubbed = isSubbed
        }
    }

    // Mutation methods for teams
    addTeam(team: Team): void {
        this._teams[team.id] = team
    }

    removeTeam(id: string): void {
        delete this._teams[id]
    }

    setTeamCaptain(teamId: string, captainId: string): void {
        const team = this._teams[teamId]
        if (team) {
            team.captainId = captainId
        }
    }

    // Restore from persisted Convex data (for game reopen)
    restoreFromConvexData(members?: Record<string, Member>, teams?: Record<string, Team>): void {
        if (members) {
            this._members = { ...members }
        }
        if (teams) {
            this._teams = { ...teams }
        }
    }

    // Add a chat message and return it with timestamp
    addChatMessage(message: Omit<ChatMessage, 'timestamp'>): ChatMessage {
        const chatMessage: ChatMessage = { ...message, timestamp: Date.now() }
        this.chatMessages.push(chatMessage)
        return chatMessage
    }

    // Get chat messages filtered for a specific member
    getChatMessagesForMember(memberId: string): ChatMessage[] {
        return this.chatMessages.filter(msg =>
            msg.target === undefined || msg.target === null || msg.target.includes(memberId)
        )
    }

    buzz(playerId: string): BuzzerData | null {
        const player = this.players[playerId]
        if (!player || !player.teamId) return null

        if (this.state.buzzedTeamIds.has(player.teamId)) {
            return null
        }

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

    newQuestion(question: Question) {
        if (!question) return

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
}
