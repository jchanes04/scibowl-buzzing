import { browser } from "$app/environment"
import { io } from "socket.io-client"
import teamsStore, { createTeamStore, type ClientTeamData, type TeamStore } from "./stores/teams"
import playersStore, { createPlayerStore, type PlayerStore } from "./stores/players"
import myMemberStore, { type MyMember } from "./stores/myMember"
import chatMessagesStore, { type ChatMessage } from "./stores/chatMessages"
import gameStore, { type ClientGameData } from "./stores/game"
import buzzAudioStore from "./stores/buzzAudio"
import type { SvelteComponentTyped } from "svelte"
import timerStore, { type TimerMethods } from "./stores/timer"
import type { Category, Question } from "$lib/classes/Game"
import moderatorsStore, { createModeratorStore } from "./stores/moderators"
import { goto } from "$app/navigation"
import type { ClientPlayer } from "$lib/classes/client/ClientPlayer"
import type { ClientModerator } from "$lib/classes/client/ClientModerator"
import type { ModeratorData } from "$lib/classes/Moderator"
import type { PlayerData } from "$lib/classes/Player"
import type { TeamData } from "$lib/classes/Team"

let teams: Record<string, ClientTeamData & { store: TeamStore }>
teamsStore.subscribe(value => teams = value)

let players: Record<string, ClientPlayer & { store: PlayerStore }>
playersStore.subscribe(value => players = value)

let moderators: Record<string, ClientModerator>
moderatorsStore.subscribe(value => moderators = value)

let chatMessages: ChatMessage[]
chatMessagesStore.subscribe(value => chatMessages = value)

let game: ClientGameData
gameStore.subscribe(value => game = value)

let myMember: MyMember
myMemberStore.subscribe(value => myMember = value)

let buzzAudio: HTMLAudioElement | null
buzzAudioStore.subscribe(value => buzzAudio = value)

let timer: SvelteComponentTyped & TimerMethods
timerStore.subscribe(value => timer = value)

const socket = io(import.meta.env.VITE_WS_URL as string, {
    autoConnect: false,
    secure: true,
    withCredentials: true
})
export default socket

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

socket.on('playerJoin', ({ player, team }: { player: PlayerData, team: TeamData }) => {
    const playerTeam = teams[team.id]?.store ?? createTeamStore(team)
    const newPlayer = createPlayerStore(player, playerTeam)
    playerTeam.addPlayer(newPlayer)
    playersStore.addPlayer(newPlayer)

    if (!teams[team.id]) {
        teamsStore.addTeam(playerTeam)
    }

    chatMessagesStore.update(oldList => {
        oldList.push({
            type: 'notification',
            text: player.name + ' has joined the game'
        })
        return oldList
    })
})

socket.on('memberRejoin', ({ member, team }: { member: PlayerData | ModeratorData, team: TeamData })=>{
    if (member.type === "moderator"){
        const newModerator = createModeratorStore(member)
        moderatorsStore.addModerator(newModerator)
    } else {
        const playerTeam = teams[team.id]?.store ?? createTeamStore(team)
        const newPlayer = createPlayerStore(member, playerTeam)
        playerTeam.addPlayer(newPlayer)
        playersStore.addPlayer(newPlayer)

        if (!teams[team.id]) {
            teamsStore.addTeam(playerTeam)
        }
    }
    chatMessagesStore.update(oldList => {
        oldList.push({
            type: 'notification',
            text: member.name + ' has rejoined the game'
        })
        return oldList
    })
})

socket.on('memberLeave', id => {
    const player = players[id]
    const moderator = moderators[id]

    if (moderator) {
        moderatorsStore.removeModerator(id)
        chatMessagesStore.update(oldList => {
            oldList.push({
                type: 'notification',
                text: moderator.name + ' has left the game'
            })
            return oldList
        })
    } else if (player) {
        playersStore.removePlayer(id)
        if (teams[player.team.id].type !== "default" && Object.values(teams[player.team.id].players).length === 1) {
            teamsStore.removeTeam(player.team.id)
        } else {
            player.team.removePlayer(id)
        }
        chatMessagesStore.update(oldList => {
            oldList.push({
                type: 'notification',
                text: player.name + ' has left the game'
            })
            return oldList
        })
    }
})

socket.on('promotion', (memberId: string) => {
    const player = players[memberId]
    const team = player.team
    if (team && player) {
        team.removePlayer(player.id)
        playersStore.removePlayer(player.id)
        const newModerator = createModeratorStore({
            id: memberId,
            name: player.name,
            type: "moderator"
        })
        moderatorsStore.addModerator(newModerator)
        chatMessagesStore.set([
            ...chatMessages,
            {
                type: 'notification',
                text: player.name + ' has been promoted to a moderator'
            }
        ])
        
        if (player.id === myMember.id) {
            myMemberStore.setMember({ memberStore: newModerator, moderator: true })
        }
    }
})

socket.on('buzz', (id: string) => {
    const player = players[id]
    if (player) {
        gameStore.buzz(player.team.id)
        buzzAudio?.play()
        timer.pause()
    
        chatMessagesStore.update(oldList => {
            oldList.push({
                type: 'buzz',
                text: player.name + ' has buzzed'
            })
            return oldList
        })
    }
})

socket.on('buzzAccept', () => {
    chatMessagesStore.update(oldList => {
        oldList.push({
            type: "buzz",
            text: "You have buzzed"
        })
        return oldList
    })
})

socket.on('buzzFailed', () => {
    chatMessagesStore.update(oldList => {
        oldList.push({
            type: "warning",
            text: "Buzz failed"
        })
        return oldList
    })
})

socket.on('scoresSaved', () => {
    chatMessagesStore.update(oldList => {
        oldList.push({
            type: "notification",
            text: "Scores saved successfully"
        })
        return oldList
    })
})

socket.on('scoresClear', () => {
    for (const t of Object.values(teams)) {
        t.scoreboard.score = 0
    }
    for (const p of Object.values(players)) {
        if (p.scoreboard) p.scoreboard.score = 0
    }
    
    chatMessagesStore.update(oldList => {
        oldList.push({
            type: "notification",
            text: "Scores cleared"
        })
        return oldList
    })
})

type ScoreData = {
    open: boolean,
    scoreType: 'correct' | 'incorrect' | 'penalty',
    playerId: string,
    playerScore: number,
    teamId: string,
    teamScore: number,
    category: Category
}

socket.on('scoreChange', ({ open, scoreType, playerId, playerScore, teamId, teamScore, category }: ScoreData) => {
    const team = teams[teamId]
    const player = players[playerId]
    if (player?.scoreboard) {
        player.scoreboard.score = playerScore
    }
    if (team) {
        team.scoreboard.score = teamScore
    }

    if (scoreType === "correct") {
        chatMessagesStore.update(oldList => {
            oldList.push({
                type: 'success',
                text: `Correct answer (${category[0].toUpperCase() + category.slice(1)})`
            })
            return oldList
        })
    } else if (scoreType === "incorrect") {
        chatMessagesStore.update(oldList => {
            oldList.push({
                type: 'warning',
                text: 'Incorrect answer'
            })
            return oldList
        })
    } else if (scoreType === "penalty") {
        chatMessagesStore.update(oldList => {
            oldList.push({
                type: 'warning',
                text: 'Penalty applied'
            })
            return oldList
        })
    }

    if (open) {
        if (myMember.team && game.state.buzzedTeamIds.includes(myMember.team.id)) {
            gameStore.openQuestion(false)
        } else {
            gameStore.openQuestion(true)
        }
    } else {
        timer.reset()
        gameStore.clearQuestion()
    }
})

type UndoScoreData = {
    score: 'correct' | 'incorrect' | 'penalty',
    playerId: string,
    playerScore: number,
    teamId: string,
    teamScore: number,
    category: Category,
    bonus: boolean
}

socket.on('scoreUndone', ({ score, playerId, playerScore, teamId, teamScore, category, bonus }: UndoScoreData) => {
    const team = teams[teamId]
    const player = players[playerId]
    if (player?.scoreboard) {
        player.scoreboard.score = playerScore
    }
    if (team) {
        team.scoreboard.score = teamScore
    }

    chatMessagesStore.update(oldList => {
        oldList.push({
            type: "notification",
            text: `Undo ${score[0].toUpperCase() + score.slice(1)} ${bonus ? "Bonus" : "Tossup"} Score (${category[0].toUpperCase() + category.slice(1)})`
        })
        return oldList
    })
})

socket.on('undoScoreFailed', () => {
    chatMessagesStore.update(oldList => {
        oldList.push({
            type: "warning",
            text: `Failed to undo scores`
        })
        return oldList
    })
})

socket.on('questionOpen', (question: Question) => {
    const buzzingEnabled = !question.bonus || (question.team && question.team === myMember.team?.id)
    gameStore.newQuestion(question, !!buzzingEnabled)
    chatMessagesStore.update(oldList => {
        oldList.push({
            type: 'notification',
            text: 'New question opened' + (teams[question.team || ""] ? " for " + teams[question.team || ""]?.name : "")
        })
        return oldList
    })
})

socket.on('timerStart', (length: number) => {
    timer.start(length)
    const questionOpen = !myMember.moderator && 
        (!game.state.currentQuestion?.bonus || game.state.currentQuestion.team === myMember.team?.id )
    gameStore.openQuestion(questionOpen)
})

socket.on('timerEnd', () => {
    if (timer.live()) {
        timer.end()
        chatMessagesStore.update(oldList => {
            oldList.push({
                type: 'warning',
                text: "Time is up"
            })
            return oldList
        })
    }
    gameStore.stopQuestion()
})

socket.on('kicked', () => {
    goto('/kicked')
    socket.disconnect()
})

socket.on('gameSwept', () => {
    goto('/swept')
    socket.disconnect()
})