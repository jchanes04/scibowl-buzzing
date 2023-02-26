import { createGameID, createMemberID } from "$lib/functions/createId"
import { GameScoreboard } from "./GameScoreboard"
import { Player, type PlayerData } from "./Player"
import { Moderator, type ModeratorData } from "./Moderator"
import type { ScoreboardData } from "./Scoreboard"
import { Team, type TeamData } from "./Team"
import { Timer } from "./Timer"

export type Category = 'earth' | 'bio' | 'chem' | 'physics' | 'math' | 'energy'

export type Question = {
    bonus: false,
    category: Category
} | {
    bonus: true,
    category: Category,
    team: Team
}

export type NewQuestionData = {
    bonus: false,
    category: Category
} | {
    bonus: true,
    category: Category,
    teamId: string
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

type BuzzedState = { // idle means no question open
    questionState: 'buzzed'
    currentBuzzer: Player,
    currentQuestion: Question
    buzzedTeams: Record<string, Team>,
    lastScored: LastScoredQuestion | null
}

type IdleState = { // idle means no question open
    questionState: 'idle'
    currentBuzzer: null,
    currentQuestion: null
    buzzedTeams: Record<string, Team>,
    lastScored: LastScoredQuestion | null
}

type OpenState = {
    questionState: 'open'
    currentBuzzer: null,
    currentQuestion: Question
    buzzedTeams: Record<string, Team>,
    lastScored: LastScoredQuestion | null
}

export type LastScoredQuestion = {
    memberId: string,
    scoreType: "correct" | "incorrect" | "penalty",
    category: Category,
    bonus: boolean
}

export type LeftPlayerData = PlayerData & { team?: TeamData & { type: "created" } }

export interface Game {
    id: string,
    joinCode: string,
    name: string,
    
    scoreboard: GameScoreboard

    moderators: Record<string, Moderator>,
    players: Record<string, Player>,
    teams: Record<string, Team>,
    spectators: Set<string>

    settings: GameSettings

    timer: Timer,
    gameClock: Timer,
    times: { //times [client, server extratime]
        tossup: [number, number],
        bonus:  [number, number]
    }
    
    lastActive: number,
    
    state: IdleState | OpenState | BuzzedState

    //stores ids of all players that have left 
    leftPlayers: Record<string, LeftPlayerData>
    leftModerators: Record<string, ModeratorData>
}

export type GameTimes = {
    tossup: [number, number],
    bonus: [number, number]
}

type GameParameters = {
    name: string,
    settings?: Partial<GameSettings>,
    teams: Team[],
    owner: Moderator,
    joinCode: string,
    times: GameTimes
}

export class Game {
    constructor({ name, settings, teams, owner, joinCode, times }: GameParameters) {
        this.id = createGameID()
        this.joinCode = joinCode.toUpperCase()  // Easier way to join games than a url with a 7 or 8 character ID

        this.name = name
        this.scoreboard = new GameScoreboard({})
        
        this.moderators = {
            [owner.id]: owner
        }
        this.players = {}
        /*
            any: allows players to play by themselves or create new teams
            teams: only allows players to join a certain set of teams specified by the reader when creating the game
            individuals: players can only play on their own
        */
        this.teams = Object.fromEntries(teams.map(t => [t.id, t]))
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
            bonus: times?.bonus || [20, 2]
        }
        // time format: [client side time, extra time allowed for latency]
        
        this.lastActive = Date.now()

        /*
            idle: no question opened, nobody can buzz
            open: a question has been opened and players can buzz in
            buzzed: a player has buzzed and their answer has not been scored
        */
        this.state = {
            questionState: 'idle',
            currentBuzzer: null,        // the player that has buzzed in
            currentQuestion: null,      // the current question information (category, is bonus)
            buzzedTeams: {},     // the teams who have buzzed, prevents different players on the same team from buzzing again
            lastScored: null
        }
        
        this.leftPlayers = {}   // players who have left the game, used for players to rejoin
        this.leftModerators = {}
    }

    get people() {
        return {
            ...this.players,
            ...this.moderators
        }
    }

    addPlayer(player: Player) {
        //error if they are already in the game
        if (this.players[player.id]) {
            return this.players
        } else {
            this.players[player.id] = player
    
            // if player's team is not already in the list of teams add their team to the list
            if (player.team && !this.teams[player.team.id]) {
                this.teams[player.team.id] = player.team
            }
            
            return this.players
        }
    }

    rejoinMember(memberId: string) {
        if (this.leftPlayers[memberId]) {
            const rejoiningPlayerData = this.leftPlayers[memberId]
            if (!rejoiningPlayerData) {
                return null
            }

            const team = this.teams[rejoiningPlayerData.teamID]

            if (team) { // team exists
                delete this.leftPlayers[memberId]
    
                const newMember = new Player({
                    name: rejoiningPlayerData.name,
                    id: memberId,
                    team,
                    score: rejoiningPlayerData.scoreboard?.score,
                    catScores: rejoiningPlayerData.scoreboard?.catScores
                })
                this.players[memberId] = newMember
    
                return newMember
            } else if (rejoiningPlayerData.team) {
                // team existed but was removed
                const newTeam = new Team(
                    rejoiningPlayerData.team.name,
                    "created",
                    [],
                    rejoiningPlayerData.team.scoreboard
                )

                delete this.leftPlayers[memberId]
    
                const newMember = new Player({
                    name: rejoiningPlayerData.name,
                    id: memberId,
                    team: newTeam,
                    score: rejoiningPlayerData.scoreboard?.score,
                    catScores: rejoiningPlayerData.scoreboard?.catScores
                })
                this.players[memberId] = newMember
    
                return newMember
            } else {
                // individual team
                delete this.leftPlayers[memberId]
    
                const newMember = new Player({
                    name: rejoiningPlayerData.name,
                    id: memberId,
                    score: rejoiningPlayerData.scoreboard?.score,
                    catScores: rejoiningPlayerData.scoreboard?.catScores
                })
                this.players[memberId] = newMember
    
                return newMember
            }
        } else if (this.leftModerators[memberId]) {
            const rejoiningPlayerData = this.leftModerators[memberId]

            delete this.leftModerators[memberId]

            const newModerator = new Moderator({
                name: rejoiningPlayerData.name,
                id: rejoiningPlayerData.id
            })
            this.moderators[memberId] = newModerator

            return newModerator
        }
    }

    removeMember(id: string) {
        if (this.players[id]) {
            const member = this.players[id]
            delete this.players[id]

            if (member.team) {
                member.team.removePlayer(id)

                if (Object.values(member.team.players).length === 0 && member.team.type === "created") {
                    this.leftPlayers[id] = {
                        ...member.data,
                        team: member.team.data as TeamData & { type: "created" }
                    }
                    delete this.teams[member.team.id]
                } else {
                    this.leftPlayers[id] = member.data
                }
            } else {
                this.leftPlayers[id] = member.data
            }

            return member
        } else if (this.moderators[id]) {
            const moderator = this.moderators[id]
            delete this.moderators[id]

            this.leftModerators[id] = moderator.data
            
            return moderator
        }
        return null
    }

    promotePlayer(id: string) {
        const player = this.players[id]
        if (player) {
            delete this.players[id]

            const newModerator = new Moderator({
                name: player.name,
                // might not need id
                id
            })
            this.moderators[id] = newModerator

            return newModerator
        }
        return null
    }

    buzz(id: string) {
        const player = this.players[id]
        if (player && !this.state.buzzedTeams[player.team.id]) {
            // if the player's team is not already in the list of teams who have buzzed
            this.state.buzzedTeams[player.team.id] = player.team
            this.state.currentBuzzer = player
            this.state.questionState = 'buzzed'

            return player
        } else {
            return null
        }
    }

    newQuestion(question: NewQuestionData) {
        this.state.questionState = 'open'
        this.state.currentBuzzer = null
        this.state.buzzedTeams = {}

        if (question.bonus) {
            const team = this.teams[question.teamId]
            this.state.currentQuestion = {
                category: question.category,
                bonus: true,
                team
            }
        } else {
            this.state.currentQuestion = {
                category: question.category,
                bonus: false
            }
        }
        return true
    }

    scoreQuestion(score: 'correct' | 'incorrect' | 'penalty') {
        if (this.state.questionState !== "buzzed")
            return null

        const buzzer = this.state.currentBuzzer

        if (this.state.currentQuestion.bonus) {
            if (score === "correct") {
                this.scoreboard.correctBonus(buzzer, this.state.currentQuestion.category)
            } else if (score === 'incorrect') {
                this.scoreboard.incorrectBonus(buzzer, this.state.currentQuestion.category)
            } else if (score === 'penalty') {
                this.scoreboard.penalty(buzzer, this.state.currentQuestion.category)
            }
        } else {
            if (score === "correct") {
                this.scoreboard.correctTossup(buzzer, this.state.currentQuestion.category)
            } else if (score === 'incorrect') {
                this.scoreboard.incorrectTossup(buzzer, this.state.currentQuestion.category)
            } else if (score === 'penalty') {
                this.scoreboard.penalty(buzzer, this.state.currentQuestion.category)
            }
        }
        
        const open = !this.state.currentQuestion.bonus
            && Object.values(this.state.buzzedTeams).length < Math.min(3, Object.values(this.teams).length)
            && score !== 'correct'

        const currentQuestion = this.state.currentQuestion
        const buzzedTeams = this.state.buzzedTeams
        if (!open) {
            this.state = {
                questionState: "idle",
                currentBuzzer: null,
                currentQuestion: null,
                buzzedTeams: {},
                lastScored: {
                    memberId: buzzer.id,
                    category: currentQuestion.category,
                    scoreType: score,
                    bonus: currentQuestion.bonus
                }
            }
        } else {
            this.state = {
                questionState: "open",
                currentBuzzer: null,
                currentQuestion,
                buzzedTeams,
                lastScored: {
                    memberId: buzzer.id,
                    category: currentQuestion.category,
                    scoreType: score,
                    bonus: currentQuestion.bonus
                }
            }
        }

        return {
            buzzer,
            open,
            category: currentQuestion.category
        }
    }

    undoScore() {
        if (!this.state.lastScored){
            return null
        }

        const buzzer = this.players[this.state.lastScored.memberId]
        if (buzzer) {
            this.scoreboard.undoScore(
                buzzer,
                this.state.lastScored.scoreType,
                this.state.lastScored.category,
                this.state.lastScored.bonus
            )
            
            const returnData = {
                score: this.state.lastScored.scoreType,
                buzzer,
                category: this.state.lastScored.category,
                bonus: this.state.lastScored.bonus
            }
            this.state.lastScored = null

            return returnData
        } else {
            return null
        }
    }

    clearScores() {
        for (const t of Object.values(this.teams)) {
            t.scoreboard.clear()
        }
        for (const p of Object.values(this.players)) {
            p.scoreboard.clear()
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

    get scores(): GameScores {
        const data: GameScores = {
            id: this.id,
            name: this.name,
            teams: {},
            players: {}
        }

        for (const t of Object.values(this.teams)) {
            if (t.type !== "individual") {
                data.teams[t.name] = {
                    score: t.scoreboard.score,
                    catScores: t.scoreboard.catScores
                }
            }
        }

        for (const m of Object.values(this.players)) {
            data.players[m.name] = {
                score: m.scoreboard.score,
                catScores: m.scoreboard.catScores
            }
        }

        return data
    }
}