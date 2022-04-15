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
import buzzAudioStore from "./buzzAudio"
import type { SvelteComponentTyped } from "svelte"
import type { TimerMethods } from "./timer"
import timerStore from "./timer"
import type { Category, Question } from "$lib/classes/Game"
import moderatorStore from "./moderators"
import { goto } from "$app/navigation"

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

let moderators : MemberData[]
moderatorStore.subscribe(value => moderators = value)

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

socket.on('authenticated', ({ name }: { name: string }) => {
    chatMessagesStore.set([...chatMessages, {
        type: 'notification',
        text: name + ' has joined the game'
    }])
})

socket.on('memberJoin', ({ member, team }: { member: MemberData, team: TeamData }) => {
    if (member.moderator){
        moderatorStore.set([...moderators,
            member
        ])
    } else {
        teamsStore.set([
            ...teams.filter(t => t.id !== team.id),
            team
        ].sort((a, b) => a.name.localeCompare(b.name)))  
    }
    chatMessagesStore.set([...chatMessages, {
        type: 'notification',
        text: member.name + ' has joined the game'
    }])
})

socket.on('memberRejoin', ({ member, team }: { member: MemberData, team: TeamData })=>{
    if (member.moderator){
        moderatorStore.set([...moderators,
            member
        ])
    } else {
        teamsStore.set([
            ...teams.filter(t => t.id !== team?.id),
            team
        ].sort((a, b) => a.name.localeCompare(b.name)))
    }
    chatMessagesStore.set([...chatMessages, {
        type: 'notification',
        text: member.name + ' has rejoined the game'
    }])
})

socket.on('memberLeave', id => {
    const member = [...members, ...moderators].find(x => x.id === id)
    const team = teams.find(t => t.id === member?.teamID)
    if (member && (member.moderator || team)) {
        if (member.moderator){
            moderatorStore.set([
                ...moderators.filter(m => m.id !== member.id)
            ])
        } else {
            if (team.members.length === 1 && gameInfo.teamSettings.newTeamsAllowed) {
                teamsStore.set(teams.filter(t => t.id !== team.id).sort((a, b) => a.name.localeCompare(b.name)))
            } else {
                teamsStore.set([
                    ...teams.filter(t => t.id !== team.id),
                    {
                        ...team,
                        members: team.members.filter(m => m.id !== member.id)
                    }
                ].sort((a, b) => a.name.localeCompare(b.name)))
            }
        }
        chatMessagesStore.set([...chatMessages, {
            type: 'notification',
            text: member.name + ' has left the game'
        }])
    }
})

socket.on('promotion', (memberId: string) => {
    const member = members.find(x => x.id === memberId)
    const team = teams.find(t => t.id === member?.teamID)
    if (team) {
        teamsStore.set([
            ...teams.filter(t => t.id !== team.id),
            {
                ...team,
                members: team.members.filter(m => m.id !== member.id)
            }
        ].sort((a, b) => a.name.localeCompare(b.name)))
        moderatorStore.set([
            ...moderators,
            {
                ...member,
                moderator: true,
                teamID: null
            }
        ])
        chatMessagesStore.set([
            ...chatMessages,
            {
                type: 'notification',
                text: member.name + ' has been promoted to a moderator'
            }
        ])
        
        if (member.id === gameInfo.myMember.id) {
            gameInfoStore.set({
                ...gameInfo,
                myMember: {
                    ...member,
                    moderator: true
                }
            })
        }
    }
})

socket.on('buzz', (id: string) => {
    const member = members.find(x => x.id === id);
    if (member) {
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
    }
})

socket.on('buzzAccept', () => {
    chatMessagesStore.set([
        ...chatMessages,
        {
            type: "buzz",
            text: "You have buzzed"
        }
    ])
})

socket.on('buzzFailed', () => {
    chatMessagesStore.set([
        ...chatMessages,
        {
            type: "warning",
            text: "Buzz failed"
        }
    ])
})

socket.on('scoresSaved', () => {
    chatMessagesStore.set([...chatMessages, {
        type: 'notification',
        text: "Scores saved successfully"
    }])
})

socket.on('scoresClear', () => {
    teams.forEach(t => {
        t.scoreboard.score = 0 
    })
    members.forEach(m => {
        m.scoreboard.score = 0  
    })
    teamsStore.set(teams.sort((a, b) => a.name.localeCompare(b.name)))
    
    chatMessagesStore.set([...chatMessages, {
        type: 'notification',
        text: 'Scores cleared'
    }])
})

type ScoreData = {
    open: boolean,
    score: 'correct' | 'incorrect' | 'penalty',
    memberID: string,
    memberScore: number,
    teamID: string,
    teamScore: number,
    category: Category
}
socket.on('scoreChange', ({ open, score, memberID, memberScore, teamID, teamScore, category }: ScoreData) => {
    const team = teams.find(t => t.id === teamID)
    const member = members.find(m => m.id === memberID)
    if (member) {
        member.scoreboard.score = memberScore
        teamsStore.set(teams.sort((a, b) => a.name.localeCompare(b.name)))
    }
    if (team) {
        team.scoreboard.score = teamScore
        teamsStore.set(teams.sort((a, b) => a.name.localeCompare(b.name)))
    }

    if (score === "correct") {
        chatMessagesStore.set([...chatMessages, {
            type: 'success',
            text: `Correct answer (${category[0].toUpperCase() + category.slice(1)})`
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
        if (gameInfo.myTeam && gameState.buzzedTeamIDs.includes(gameInfo.myTeam.id)) {
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

type UndoScoreData = {
    score: 'correct' | 'incorrect' | 'penalty',
    memberID: string,
    memberScore: number,
    teamID: string,
    teamScore: number,
    category: Category,
    bonus: boolean
}
socket.on('scoreUndone', ({ score, memberID, memberScore, teamID, teamScore, category, bonus }: UndoScoreData) => {
    const team = teams.find(t => t.id === teamID)
    const member = members.find(m => m.id === memberID)
    if (member) {
        member.scoreboard.score = memberScore
        teamsStore.set(teams.sort((a, b) => a.name.localeCompare(b.name)))
    }
    if (team) {
        team.scoreboard.score = teamScore
        teamsStore.set(teams.sort((a, b) => a.name.localeCompare(b.name)))
    }

    chatMessagesStore.set([
        ...chatMessages,
        {
            type: "notification",
            text: `Undo ${score[0].toUpperCase() + score.slice(1)} ${bonus ? "Bonus" : "Tossup"} Score (${category[0].toUpperCase() + category.slice(1)})`
        }
    ])
})

socket.on('undoScoreFailed', () => {
    chatMessagesStore.set([
        ...chatMessages,
        {
            type: "warning",
            text: "Failed to undo scores"
        }
    ])
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
            buzzedTeamIDs: [],
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
    if (gameInfo.myTeam && !gameState.buzzedTeamIDs.includes(gameInfo.myTeam.id)) {
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

socket.on('kicked', () => {
    goto('/kicked')
    socket.disconnect()
})

socket.on('gameSwept', () => {
    goto('/swept')
    socket.disconnect()
})