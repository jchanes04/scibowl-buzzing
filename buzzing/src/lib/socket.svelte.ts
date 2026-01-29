import { browser } from "$app/environment"
import { io, Socket } from "socket.io-client"
import gameStore from "./stores/game.svelte"
import { timerStore, gameClockStore } from "./stores/timer.svelte"
import visualBonusStore from "./stores/visualBonus.svelte"
import { goto, invalidateAll } from "$app/navigation"
import type { Category, Question, ScoreType, BuzzerData } from "$lib/classes/Game"
import {
    teamsStore,
    playersStore,
    myMemberStore
} from "./stores/members.svelte"
import { addChatMessage, type ChatMessage } from "./stores/chatMessages.svelte"

// Direct access to store values via getters
const getTeams = () => teamsStore.value
const getPlayers = () => playersStore.value
const getMyMember = () => myMemberStore.value

let game = $derived(gameStore.value)

let visualBonus = $derived(visualBonusStore.value)

const buzzAudio = browser ? new Audio('/buzz.mp3') : null

let existingSocket: Socket

export function createSocket(spectator: boolean = false) {
    if (existingSocket) existingSocket.disconnect()

    // Connect to the same origin - no need for separate WebSocket URL
    // Socket.io will automatically connect to the server that served the page
    const socket = io({
        autoConnect: false,
        withCredentials: true,
        query: {
            spectator
        }
    })
    existingSocket = socket

    if (browser) {
        socket.connect()
    }

    socket.onAny((event: string, ...args: any[]) => {
        console.log(event, args);
    })

    // Handle new chat messages from socket
    socket.on('chatMessage', (message: ChatMessage) => {
        addChatMessage(message)
    })

    socket.on('promotion', async (memberId: string) => {
        // If I was promoted, I need to refresh the page to get moderator controls
        const myMember = getMyMember()
        if (memberId === myMember.id) {
            socket.once("disconnect", async () => {
                await invalidateAll()
                socket.connect()
            })
            socket.disconnect()
        }
    })


    socket.on('changeCaptain', (teamId: string, memberId: string) => {
        // Team captain updates handled by Convex subscription
        // But we need to update buzzing state based on captain change
        const myMember = getMyMember()

        if (
            game.state.questionState === "open"
            && game.state.currentQuestion?.bonus
            && game.state.currentQuestion.teamId === myMember.team?.id
            && memberId === myMember.id
        ) {
            gameStore.enableBuzzing()
        } else if (
            game.state.questionState === "open"
            && game.state.currentQuestion?.bonus
            && game.state.currentQuestion.teamId === myMember.team?.id
        ) {
            gameStore.disableBuzzing()
        }
        // Chat message handled by Convex (from PlayerControls.svelte)
    })

    socket.on('buzz', (id: string) => {
        const player = getPlayers()[id]
        if (player) {
            const buzzerData: BuzzerData = {
                id: player.id,
                name: player.name,
                teamId: player.team.id
            }
            gameStore.buzz(player.team.id, buzzerData)
            buzzAudio?.play()
            timerStore.pause()
            // Chat message handled by Convex (from server.ts)
        }
    })

    socket.on('buzzFailed', () => {
        const myMember = getMyMember()
        if (myMember.team) gameStore.removeTeamBuzz(myMember.team.id)
        // Chat message handled by Convex (from server.ts)
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
        const team = getTeams()[teamId]

        if (!team) {
            return
        }

        if (bonus) {
            if (visualBonus.window) {
                visualBonus.window.close()
                visualBonusStore.value = {
                    url: null,
                    window: null
                }
            }
            timerStore.end()
            gameStore.clearQuestion()
        }

        // Scoreboard mutations handled by Convex subscription
        // Chat messages handled by Convex (from ReaderControls.svelte)

        const myMember = getMyMember()
        if (open && game.state.currentQuestion) {
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

    socket.on("deadQuestion", (number: number, category: Category) => {
        // Scoreboard dead marking handled by Convex subscription
        timerStore.end()
        gameStore.clearQuestion()
        // Chat message handled by Convex (from ReaderControls.svelte)
    })

    socket.on('questionOpen', (question: Question) => {
        const myMember = getMyMember()
        const teams = getTeams()
        const buzzingEnabled = !question.bonus
            || !!(question.teamId
                && question.teamId === myMember.team?.id
                && (teams[question.teamId]?.captainId === myMember.id
                    || !teams[question.teamId]?.captainId))
        gameStore.newQuestion(question, buzzingEnabled)

        if (!question.bonus || !question.visual) {
            console.log("clearing")
            visualBonusStore.value = {
                url: null,
                window: visualBonusStore.value.window
            }
            if (visualBonus.window) visualBonus.window.document.body.innerHTML =
                `<style>
                    img {
                        width: 100%;
                    }
                </style>
                <div></div>`
        }

        // Chat message handled by Convex (from ReaderControls.svelte)
    })

    socket.on("visualBonusOpen", (data: Buffer) => {
        if (getMyMember().moderator) return

        const blob = new Blob([new Uint8Array(data)])
        const url = URL.createObjectURL(blob)
        visualBonusStore.value = {
            url,
            window: visualBonusStore.value.window
        }
    })

    // QuestionTimer events

    socket.on('timerStart', (length: number) => {
        timerStore.start(length)
        const myMember = getMyMember()
        const teams = getTeams()
        const bonusOpen = !!game.state.currentQuestion?.bonus
            && (game.state.currentQuestion?.teamId === myMember.team?.id
                && (teams[myMember.team?.id ?? ""]?.captainId === myMember.id || teams[myMember.team?.id ?? ""]?.captainId === null))
        const buzzingEnabled = !myMember.moderator
            && (!game.state.currentQuestion?.bonus || bonusOpen)
            && !game.state.buzzedTeamIds.includes(myMember.team?.id ?? "")
        gameStore.openQuestion(buzzingEnabled)
    })

    socket.on('timerEnd', () => {
        if (timerStore.live) {
            timerStore.end()
            // Chat message handled by Convex (from server.ts)
        }
        gameStore.stopQuestion()
    })

    socket.on('timerStop', () => {
        if (timerStore.live) {
            timerStore.end()
        }
    })

    // Game Clock events

    socket.on("gameClockStart", (length: number) => {
        gameClockStore.start(length)
        // Chat message handled by Convex (from ReaderControls.svelte)
    })

    socket.on("gameClockUpdate", (length: number) => {
        gameClockStore.start(length)
    })

    socket.on("gameClockPause", () => {
        gameClockStore.pause()
        // Chat message handled by Convex (from ReaderControls.svelte)
    })

    socket.on("gameClockResume", () => {
        gameClockStore.resume()
        // Chat message handled by Convex (from ReaderControls.svelte)
    })

    socket.on("gameClockEnd", () => {
        gameClockStore.end()
        // Chat message handled by Convex (from ReaderControls.svelte)
    })

    socket.on("gameClockStop", () => {
        gameClockStore.stop()
        // Chat message handled by Convex (from ReaderControls.svelte)
    })


    // Redirection events

    socket.on('kicked', () => {
        goto('/kicked')
        socket.disconnect()
    })

    socket.on('replaced', () => {
        goto('/replaced')
        socket.disconnect()
    })

    socket.on('gameEnd', () => {
        goto('/')
        socket.disconnect()
    })

    return socket
}

export default () => existingSocket
