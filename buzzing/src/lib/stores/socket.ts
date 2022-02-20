import { browser } from "$app/env"
import { io, Socket } from "socket.io-client"
import { writable, Writable } from "svelte/store"
import Cookie from 'js-cookie'
import type { MemberData } from "$lib/classes/Member"
import type { TeamData } from "$lib/classes/Team"
import teamsStore from "./teams"
import membersStore from "./members"
import type { ChatMessage } from "./chatMessages"
import chatMessagesStore from "./chatMessages"
import type { GameInfo } from "./gameInfo"
import gameInfoStore from "./gameInfo"
import gameStateStore, { GameState } from "./gameState"
import { emptyCatScores } from '$lib/classes/Scoreboard'
import buzzAudioStore from "./buzzAudio"
import type { SvelteComponentTyped } from "svelte"
import type { TimerMethods } from "./timer"
import timerStore from "./timer"
import type { Question } from "$lib/classes/Game"

const socketStore: Writable<Socket> = writable(io(import.meta.env.VITE_WS_URL as string, {
    auth: {
        authToken: Cookie.get('authToken') as string
    },
    autoConnect: false,
    secure: true
}))
export default socketStore

let socket: Socket
socketStore.subscribe(value => socket = value)

let teams: TeamData[]
teamsStore.subscribe(value => teams = value)

let members: MemberData[]
membersStore.subscribe(value => members = value)

let chatMessages: ChatMessage[]
chatMessagesStore.subscribe(value => chatMessages = value)

let gameInfo: GameInfo
gameInfoStore.subscribe(value => gameInfo = value)

let gameState: GameState
gameStateStore.subscribe(value => gameState = value)

let buzzAudio: HTMLAudioElement
buzzAudioStore.subscribe(value => buzzAudio = value)

let timer: SvelteComponentTyped & TimerMethods
timerStore.subscribe(value => timer = value)

if (browser) {
    socket.connect()
}

socket.onAny((event: string, ...args: any[]) => {
    console.log(event, args);
})

socket.on('memberJoin', ({ member, team }: { member: MemberData, team: TeamData }) => {
    teamsStore.set([
        ...teams.filter(t => t.id !== team.id),
        team
    ])
    chatMessagesStore.set([...chatMessages, {
        type: 'notification',
        text: member.name + ' has joined the game'
    }])
})

socket.on('memberLeave', id => {
    const member = members.find(x => x.id === id)
    const team = teams.find(t => t.id === member.teamID)
    if (team.members.length === 1 && !gameInfo.teamSettings.newTeamsAllowed) {
        teamsStore.set(teams.filter(t => t.id !== team.id))
    } else {
        teamsStore.set([
            ...teams.filter(t => t.id !== team.id),
            {
                ...team,
                members: team.members.filter(m => m.id !== member.id)
            }
        ])
    }
    chatMessagesStore.set([...chatMessages, {
        type: 'notification',
        text: member.name + ' has left the game'
    }])
})

socket.on('buzz', (id: string) => {
    const member = members.find(x => x.id === id);
    gameStateStore.set({
        buzzedTeamIDs: [...gameState.buzzedTeamIDs, member.teamID],
        questionState: "buzzed",
        buzzingDisabled: true
    })

    buzzAudio.play()

    chatMessagesStore.set([...chatMessages, {
        type: 'buzz',
        text: member.name + ' has buzzed'
    }])
    
    timer.pause()
})

socket.on('scoresSaved', () => {
    chatMessagesStore.set([...chatMessages, {
        type: 'notification',
        text: "Scores saved successfully"
    }])
})

socket.on('scoresClear', () => {
    teams.forEach(t => {
        t.scoreboard.clear()
    })
    members.forEach(m => {
        m.scoreboard.clear()
    })
    teamsStore.set(teams)
    
    chatMessagesStore.set([...chatMessages, {
        type: 'notification',
        text: 'Scores cleared'
    }])
})

socket.on('scoreChange', (
    { open, score, memberID, memberScore, teamID, teamScore }: 
    { open: boolean, score: 'correct' | 'incorrect' | 'penalty', memberID: string, memberScore: number, teamID: string, teamScore: number }
) => {
    const team = teams.find(t => t.id === teamID)
    const member = members.find(m => m.id === memberID)
    if (member) {
        member.scoreboard.setScore(memberScore)
        teamsStore.set(teams)
    }
    if (team) {
        team.scoreboard.setScore(teamScore)
        teamsStore.set(teams)
    }

    if (score === "correct") {
        chatMessagesStore.set([...chatMessages, {
            type: 'success',
            text: 'Correct answer'
        }])
    } else if (score === "incorrect") {
        chatMessagesStore.set([...chatMessages, {
            type: 'warning',
            text: 'Incorrect answer'
        }])
    } else if (score === "penalty") {
        chatMessagesStore.set([...chatMessages, {
            type: 'warning',
            text: 'Penalty applied'
        }])
    }

    if (open) {
        timer.resume()
        if (gameState.buzzedTeamIDs.includes(gameInfo.myTeam.id)) {
            gameStateStore.set({
               ...gameState,
               questionState: 'open',
               buzzingDisabled: true
            })
        } else {
            gameStateStore.set({
                ...gameState,
                questionState: 'open',
                buzzingDisabled: false
            })
        }
    } else {
        timer.reset()
        gameStateStore.set({
            questionState: 'idle',
            buzzingDisabled: true,
            buzzedTeamIDs: []
        })
    }
})

socket.on('questionOpen', (question: Question) => {
    if (question.team && question.team !== gameInfo.myTeam.id) {
        gameStateStore.set({
            questionState: 'open',
            buzzedTeamIDs: [gameInfo.myTeam.id],
            buzzingDisabled: true
        })
    } else {
        gameStateStore.set({
            questionState: 'open',
            buzzedTeamIDs: [gameInfo.myTeam.id],
            buzzingDisabled: false
        })
    }
    chatMessagesStore.set([...chatMessages, {
        type: 'notification',
        text: 'New question opened' + (teams.find(x => x.id === question.team) ? " for " + teams.find(x => x.id === question.team)?.name : "")
    }])
})

socket.on('timerStart', (length: number) => {
    timer.start(length)
    if (!gameState.buzzedTeamIDs.includes(gameInfo.myTeam.id)) {
        gameStateStore.set({
            ...gameState,
            questionState:'open',
            buzzingDisabled:false
        })
    } else {
        gameStateStore.set({
            ...gameState,
            questionState:'open',
            buzzingDisabled:true
        })
    }
})

socket.on('timerEnd', () => {
    if (timer.live()) {
        timer.end()
        chatMessagesStore.set([...chatMessages, {
            type: 'warning',
            text: "Time is up"
        }])
    }
    gameStateStore.set({
        ...gameState,
        questionState:'idle',
        buzzingDisabled: true
    })
})