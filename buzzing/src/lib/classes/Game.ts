import { createGameID } from "$lib/functions/createId"
import { GameScoreboard } from "./GameScoreboard"
import type { IndividualTeam } from "./IndividualTeam"
import type { Member } from "./Member"
import { Team } from "./Team"
import { Timer } from "./Timer"

export type Message = {
    text: string,
    type: 'buzz' | 'notification' | 'warning' | 'success'
}

export type Category = 'earth' | 'bio' | 'chem' | 'physics' | 'math' | 'energy'
export type TeamFormat = 'any' | 'individuals' | 'teams'

export type Question = {
    bonus: boolean,
    category: Category,
    team?: string
}

export interface Game {
    id: string,
    joinCode: string,

    name: string,
    scoreboard: GameScoreboard

    owner: Member,
    members: Member[],
    teamFormat: TeamFormat,
    teams: Array<Team | IndividualTeam>

    chatMessages: Message[],

    timer: Timer,
    times: {
        tossup: [number, number],
        bonus: [number, number]
    }

    state: {
        questionState: 'idle' | 'open' | 'buzzed'
        currentBuzzer: Member | null,
        currentQuestion: {
            category: Category,
            bonus: boolean
        } | null
        buzzedTeams: Array<Team | IndividualTeam>
    }

    leftPlayers: string[]
}

export class Game {
    constructor({ name, teamFormat, teams, ownerMember, joinCode, times }: { name: string, teamFormat: TeamFormat, teams: Team[], ownerMember: Member, joinCode: string, times?: { tossup: [number, number], bonus: [number, number] } }) {
        this.id = createGameID()
        this.joinCode = joinCode.toUpperCase()  // Easier way to join games than a url with a 7 or 8 character ID

        this.name = name
        this.scoreboard = new GameScoreboard({})
        
        this.owner = ownerMember
        this.members = [ownerMember]
        this.teamFormat = teamFormat
        /*
            any: allows players to play by themselves or create new teams
            teams: only allows players to join a certain set of teams specified by the reader when creating the game
            individuals: players can only play on their own
        */
        this.teams = [ownerMember.team, ...teams]

        this.chatMessages = []  // stores chat history

        this.timer = new Timer()
        this.times = {  
            tossup: times?.tossup || [5, 2],
            bonus: times?.bonus || [20, 2]
        }
        // time format: [client side time, extra time allowed for latency]
        
        /*
            idle: no question opened, nobody can buzz
            open: a question has been opened and players can buzz in
            buzzed: a player has buzzed and their answer has not been scored
        */
        this.state = {
            questionState: 'idle',
            currentBuzzer: null,        // the player that has buzzed in
            currentQuestion: null,      // the current question information (category, is bonus)
            buzzedTeams: []     // the teams who have buzzed, prevents different players on the same team from buzzing again
        }
        
        this.leftPlayers = []   // players who have left the game, used for players to rejoin
    }

    addMember(member: Member) {
        if (this.members.some(x => x.id === member.id)) throw new Error("Member is already in the game")
        if (this.leftPlayers.includes(member.id)) this.leftPlayers = this.leftPlayers.filter(m => m !== member.id)
        this.members = [...this.members, member]

        if (!this.teams.some(t => t.id === member.team.id)) {   // if player's team is not already in the list of teams
            this.teams.push(member.team)
        }
        
        return this.members
    }

    removeMember(id: string) {
        let member = this.members.find(x => x.id === id)
        if (member) {
            this.members = this.members.filter(x => x.id !== id)
            if (member.team instanceof Team) member.team.removeMember(member.id)
            this.leftPlayers.push(member.id)
            return member
        }
        return null
    }

    addChatMessage(message: Message) {
        this.chatMessages.push(message)
    }

    buzz(memberID: string) {
        let member = this.members.find(x => x.id === memberID)
        if (member && !this.state.buzzedTeams.some(x => x.id === member.team.id)) {     // if the player's team is not already in the list of teams who have buzzed
            this.state.buzzedTeams.push(member.team)
            this.state.currentBuzzer = member
            this.state.questionState = 'buzzed'
            return member
        } else {
            return false
        }
    }

    newQ(memberID: string, question: Question ) {
        if (this.members.find(x => x.id === memberID) === this.owner) {     // only allow new questions to be made by the owner/reader
            this.state.currentBuzzer = null
            this.state.currentQuestion = question
            this.state.questionState = 'open'
            this.state.buzzedTeams = []
            return true
        } else {

        }
    }

    scoreQ(score: 'correct' | 'incorrect' | 'penalty') {
        let scoredMember = this.state.currentBuzzer

        if (this.state.currentQuestion.bonus) {
            if (score === "correct") {
                this.scoreboard.correctBonus(scoredMember, this.state.currentQuestion.category)
            } else if (score === 'incorrect') {
                this.scoreboard.incorrectBonus(scoredMember, this.state.currentQuestion.category)
            } else if (score === 'penalty') {
                this.scoreboard.penalty(scoredMember, this.state.currentQuestion.category)
            }
        } else {
            if (score === "correct") {
                this.scoreboard.correctTossup(scoredMember, this.state.currentQuestion.category)
            } else if (score === 'incorrect') {
                this.scoreboard.incorrectTossup(scoredMember, this.state.currentQuestion.category)
            } else if (score === 'penalty') {
                this.scoreboard.penalty(scoredMember, this.state.currentQuestion.category)
            }
        }

        this.state.currentBuzzer = null
        
        let open = !this.state.currentQuestion.bonus && 
            this.state.buzzedTeams.length < 3 && 
            this.state.buzzedTeams.length < this.teams.length - 1 && 
            score !== 'correct'

        if (!open) {
            this.state.currentQuestion = null
            this.state.questionState = 'idle'
        } else {
            this.state.questionState = 'open'
        }

        return {
            scoredMember,
            open,
            scoredTeam: scoredMember.team
        }
    }

    clearScores() {
        this.teams.forEach(t => {
            t.scoreboard.clear()
        })
        this.members.forEach(m => {
            m.scoreboard.clear()
        })
    }
}