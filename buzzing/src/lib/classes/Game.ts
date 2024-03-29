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
    number: number
} | {
    bonus: true,
    category: Category,
    team: Team,
    number: number,
    visual?: boolean
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

type BuzzedState = { // idle means no question open
    questionState: 'buzzed'
    currentBuzzer: Player,
    currentQuestion: Question
    buzzedTeams: Record<string, Team>
}

type IdleState = { // idle means no question open
    questionState: 'idle'
    currentBuzzer: null,
    currentQuestion: null
    buzzedTeams: Record<string, Team>
}

type OpenState = {
    questionState: 'open'
    currentBuzzer: null,
    currentQuestion: Question
    buzzedTeams: Record<string, Team>,
}

export type ScoreType = "correct" | "incorrect" | "penalty"

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
        bonus:  [number, number],
        visual: [number, number]
    }
    
    lastActive: number,
    
    state: IdleState | OpenState | BuzzedState

    //stores ids of all players that have left 
    leftPlayers: Record<string, LeftPlayerData>
    leftModerators: Record<string, ModeratorData>
}

export type GameTimes = {
    tossup?: [number, number],
    bonus?: [number, number],
    visual?: [number, number]
}

type GameParameters = {
    name: string,
    settings?: Partial<GameSettings>,
    teams: Team[],
    owner: Moderator,
    joinCode: string,
    times?: GameTimes
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
            bonus: times?.bonus || [20, 2],
            visual: times?.visual || [30, 2]
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
            buzzedTeams: {}    // the teams who have buzzed, prevents different players on the same team from buzzing again
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
                })
                this.players[memberId] = newMember
    
                return newMember
            } else if (rejoiningPlayerData.team) {
                // team existed but was removed
                const newTeam = new Team(
                    rejoiningPlayerData.team.name,
                    "created",
                    []
                )

                delete this.leftPlayers[memberId]
    
                const newMember = new Player({
                    name: rejoiningPlayerData.name,
                    id: memberId,
                    team: newTeam
                })
                this.players[memberId] = newMember
    
                return newMember
            } else {
                // individual team
                delete this.leftPlayers[memberId]
    
                const newMember = new Player({
                    name: rejoiningPlayerData.name,
                    id: memberId,
                })
                this.players[memberId] = newMember
    
                return newMember
            }
        } else if (this.leftModerators[memberId]) {
            const rejoiningPlayerData = this.leftModerators[memberId]
            if (!rejoiningPlayerData) return

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
        const member = this.players[id]
        const moderator = this.moderators[id]
        if (member) {
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
        } else if (moderator) {
            delete this.moderators[id]

            this.leftModerators[id] = moderator.data
            
            return moderator
        }
        return null
    }

    kickPlayer(id: string) {
        const member = this.players[id]
        if (member) {
            delete this.players[id]

            if (member.team) {
                member.team.removePlayer(id)
            }

            return member
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
        if (!question || (question.bonus && !this.teams[question.teamId])) return

        this.state.questionState = 'open'
        this.state.currentBuzzer = null
        this.state.buzzedTeams = {}

        if (question.bonus) {
            const team = this.teams[question.teamId]
            this.state.currentQuestion = {
                category: question.category,
                bonus: true,
                visual: question.visual,
                team: team!,
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
        const number = this.state.currentQuestion.number
        const bonus = this.state.currentQuestion.bonus
        const team = currentQuestion.bonus ? currentQuestion.team : buzzer!.team

        if (bonus) {
            if (score === "correct") {
                this.scoreboard.correctBonus(
                    number,
                    team?.id,
                    currentQuestion.category
                )
            } else if (score === 'incorrect') {
                this.scoreboard.incorrectBonus(
                    number,
                    team?.id,
                    currentQuestion.category
                )
            }
        } else {
            if (!buzzer) {
                return
            } else if (score === "correct") {
                this.scoreboard.correctTossup(
                    number,
                    buzzer.id,
                    team?.id,
                    currentQuestion.category
                )
            } else if (score === 'incorrect') {
                this.scoreboard.incorrectTossup(
                    number,
                    buzzer.id,
                    team?.id,
                    currentQuestion.category
                )
            } else if (score === 'penalty') {
                this.scoreboard.penalty(
                    number,
                    buzzer.id,
                    team?.id,
                    currentQuestion.category
                )
            }
        }
        
        const open = !bonus
            && Object.values(this.state.buzzedTeams).length < Math.min(3, Object.values(this.teams).length)
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
            team,
            open,
            category: currentQuestion.category,
            number,
            bonus
        }
    }

    markDead() {
        if (!this.state.currentQuestion) return null
        const number = this.state.currentQuestion.number
        const category = this.state.currentQuestion.category
        this.scoreboard.dead(number, category)

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

    clearScores() {
        this.scoreboard = new GameScoreboard({})
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