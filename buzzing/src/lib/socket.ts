import { browser } from "$app/environment"
import { io, Socket } from "socket.io-client"
import teamsStore, { createTeamStore, type ClientTeamData, type TeamStore } from "./stores/teams"
import playersStore, { createPlayerStore, type PlayerStore } from "./stores/players"
import myMemberStore, { type MyMember } from "./stores/myMember"
import chatMessagesStore, { type ChatMessage } from "./stores/chatMessages"
import gameStore, { type ClientGameData } from "./stores/game"
import buzzAudioStore from "./stores/buzzAudio"
import type { SvelteComponentTyped } from "svelte"
import { timerStore, gameClockStore } from "./stores/timer"
import type { Category, NewQuestionData, Question } from "$lib/classes/Game"
import moderatorsStore, { createModeratorStore } from "./stores/moderators"
import { goto } from "$app/navigation"
import type { ClientPlayer } from "$lib/classes/client/ClientPlayer"
import type { ClientModerator } from "$lib/classes/client/ClientModerator"
import type { ModeratorData } from "$lib/classes/Moderator"
import type { PlayerData } from "$lib/classes/Player"
import type { TeamData } from "$lib/classes/Team"
import { env } from "$env/dynamic/public"

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

let timer: number
timerStore.subscribe(value => timer = value)

let existingSocket: Socket

export function createSocket() {
    if (existingSocket) existingSocket.disconnect()

    const socket = io(env.PUBLIC_WS_URL as string, {
        autoConnect: false,
        secure: true,
        withCredentials: true
    })
    existingSocket = socket

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
            timerStore.pause()
        
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
        gameStore.scoreboard.clear()
        
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
        bonus: boolean,
        scoreType: 'correct' | 'incorrect' | 'penalty',
        playerId: string,
        teamId: string,
        category: Category,
        number: number
    }

    socket.on('scoreChange', ({ open, scoreType, playerId, teamId, bonus, category, number }: ScoreData) => {
        const team = teams[teamId]

        if (!team) {
            return
        }

        if (scoreType === "correct") {
            if (bonus) {
                gameStore.scoreboard.correctBonus(number, teamId, category)
            } else {
                console.log('correct tossup')
                gameStore.scoreboard.correctTossup(number, playerId, teamId, category)
            }

            chatMessagesStore.update(oldList => {
                oldList.push({
                    type: 'success',
                    text: `Correct answer (${category[0].toUpperCase() + category.slice(1)})`
                })
                return oldList
            })
        } else if (scoreType === "incorrect") {
            if (bonus) {
                gameStore.scoreboard.incorrectBonus(number, teamId, category)
            } else {
                gameStore.scoreboard.incorrectTossup(number, playerId, teamId, category)
            }

            chatMessagesStore.update(oldList => {
                oldList.push({
                    type: 'warning',
                    text: 'Incorrect answer'
                })
                return oldList
            })
        } else if (scoreType === "penalty") {
            if (!bonus) {
                gameStore.scoreboard.penalty(number, playerId, teamId, category)
            }

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
            timerStore.end()
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

    socket.on('questionOpen', (question: NewQuestionData) => {
        console.log(question)
        const buzzingEnabled = !question.bonus || (question.teamId === myMember.team?.id && teams[question.teamId].captainId === myMember.id)
        gameStore.newQuestion(question, !!buzzingEnabled)
        chatMessagesStore.update(oldList => {
            const teamName = teams[question.bonus ? question.teamId : ""]?.name
            if (question.number) {
                oldList.push({
                    type: "notification",
                    text: `${question.bonus ? "Bonus" : "Tossup"} #${question.number} opened` + (teamName ? " for " + teamName : "")
                })
            } else {
                oldList.push({
                    type: 'notification',
                    text: `New ${question.bonus ? "bonus" : "tossup"} opened` + (teamName ? " for " + teamName : "")
                })
            }
            return oldList
        })
    })

    socket.on('timerStart', (length: number) => {
        timerStore.start(length)
        const questionOpen = !myMember.moderator && 
            (!game.state.currentQuestion?.bonus || game.state.currentQuestion.teamId === myMember.team?.id )
        gameStore.openQuestion(questionOpen)
    })

    socket.on('timerEnd', () => {
        if (timerStore.live) {
            timerStore.end()
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

    socket.on("gameClockStart", (length: number) => {
        gameClockStore.start(length)
        chatMessagesStore.update(oldList => {
            oldList.push({
                type: "notification",
                text: `${Math.floor(length / 60).toString().padStart(2, "0")}:${(length % 60).toString().padStart(2, "0")} game clock started`
            })
            return oldList
        })
    })

    socket.on("gameClockUpdate", (length: number) => {
        gameClockStore.start(length)
    })

    socket.on("gameClockPause", () => {
        gameClockStore.pause()
        chatMessagesStore.update(oldList => {
            oldList.push({
                type: "notification",
                text: "Game clock paused"
            })
            return oldList
        })
    })

    socket.on("gameClockResume", () => {
        gameClockStore.resume()
        chatMessagesStore.update(oldList => {
            oldList.push({
                type: "notification",
                text: "Game clock resumed"
            })
            return oldList
        })
    })

    socket.on("gameClockEnd", () => {
        gameClockStore.end()
        chatMessagesStore.update(oldList => {
            oldList.push({
                type: "notification",
                text: "Game clock ended"
            })
            return oldList
        })
    })

    socket.on("gameClockStop", () => {
        gameClockStore.stop()
        chatMessagesStore.update(oldList => {
            oldList.push({
                type: "notification",
                text: "Game clock stopped"
            })
            return oldList
        })
    })

    socket.on('changeCaptain', (teamId: string, memberId: string) => {
        const team = teams[teamId]
        if (!team) return

        team.store.changeCaptain(memberId)
    })

    socket.on('kicked', () => {
        goto('/kicked')
        socket.disconnect()
    })

    socket.on('gameSwept', () => {
        goto('/swept')
        socket.disconnect()
    })

    socket.on('gameEnd', () => {
        goto('/')
        socket.disconnect()
    })

    return socket
}

export default () => existingSocket