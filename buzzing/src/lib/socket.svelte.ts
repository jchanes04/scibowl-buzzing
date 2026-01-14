import { browser } from "$app/environment"
import { io, Socket } from "socket.io-client"
import { teamsStore, playersStore, myMemberStore } from "./stores/members.svelte"
import gameStore from "./stores/game.svelte"
import { timerStore, gameClockStore } from "./stores/timer.svelte"
import visualBonusStore from "./stores/visualBonus.svelte"
import { goto, invalidateAll } from "$app/navigation"
import type { Category, NewQuestionData, ScoreType } from "$lib/classes/Game"
import { env } from "$env/dynamic/public"

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

    const socket = io(env.PUBLIC_WS_URL as string, {
        autoConnect: false,
        secure: true,
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

    socket.on('authenticated', ({ name }: { name: string }) => {
        // Chat message handled by Convex (join message from page.server.ts)
    })

    // Member store updates now handled by Convex subscription
    socket.on('playerJoin', () => {
        // Member updates handled by Convex subscription
    })

    socket.on('memberRejoin', () => {
        // Member updates handled by Convex subscription
    })

    socket.on('memberLeave', () => {
        // Member updates handled by Convex subscription
    })

    socket.on('promotion', async (memberId: string) => {
        // Member updates handled by Convex subscription
        // But we still need to handle the socket reconnection for self-promotion
        const myMember = getMyMember()
        if (memberId === myMember.id) {
            socket.once("disconnect", async () => {
                await invalidateAll()
                socket.connect()
            })
            socket.disconnect()
        }
    })

    socket.on('nameChange', () => {
        // Member updates handled by Convex subscription
    })

    socket.on('buzz', (id: string) => {
        const player = getPlayers()[id]
        if (player) {
            gameStore.buzz(player.team.id, player)
            buzzAudio?.play()
            timerStore.pause()
            // Chat message handled by Convex (from server.ts)
        }
    })

    socket.on('buzzAccept', () => {
        // Chat message handled by Convex (from server.ts)
    })

    socket.on('buzzFailed', () => {
        const myMember = getMyMember()
        if (myMember.team) gameStore.removeTeamBuzz(myMember.team.id)
        // Chat message handled by Convex (from server.ts)
    })

    socket.on('scoresClear', () => {
        // Scoreboard clearing handled by Convex subscription
        // Chat message handled by Convex (from ExpandedScoreboard.svelte)
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

    socket.on('tossupEdit', (
        number: number,
        playerId: string,
        teamId: string,
        category: Category,
        scoreType: ScoreType | "none"
    ) => {
        // Scoreboard editing handled by Convex subscription
    })

    socket.on("bonusEdit", (
        number: number,
        teamId: string,
        scoreType: "correct" | "incorrect" | "none"
    ) => {
        // Scoreboard editing handled by Convex subscription
    })

    socket.on("questionDelete", (number: number) => {
        // Scoreboard deletion handled by Convex subscription
    })

    socket.on('questionOpen', (question: NewQuestionData) => {
        const myMember = getMyMember()
        const teams = getTeams()
        const buzzingEnabled = !question.bonus || !!(question.teamId && question.teamId === myMember.team?.id && teams[question.teamId]?.captainId === myMember.id)
        gameStore.newQuestion(question, buzzingEnabled)

        // Scoreboard clearing handled by Convex subscription

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

    socket.on('timerStart', (timerData: { startTime: number, duration: number }) => {
        timerStore.start(timerData.startTime, timerData.duration)
        const myMember = getMyMember()
        const teams = getTeams()
        const tossupOpen = !game.state.currentQuestion?.bonus && !game.state.buzzedTeamIds.includes(myMember.team!.id)
        const bonusOpen = !!game.state.currentQuestion?.bonus
            && (game.state.currentQuestion?.teamId === myMember.team?.id
                && (teams[myMember.team?.id]?.captainId === myMember.id || teams[myMember.team?.id]?.captainId === null))
        const questionOpen = !myMember.moderator && (tossupOpen || bonusOpen)
        gameStore.openQuestion(questionOpen)
    })

    socket.on('timerEnd', () => {
        if (timerStore.live) {
            timerStore.end()
            // Chat message handled by Convex (from server.ts)
        }
        gameStore.stopQuestion()
    })

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

    socket.on('changeCaptain', (teamId: string, memberId: string) => {
        // Captain change handled by Convex subscription
        // But we still need to handle the buzzing state for bonus questions
        const teams = getTeams()
        const team = teams[teamId]
        if (!team) return

        const member = team.players[memberId]
        if (!member) return

        const myMember = getMyMember()
        if (
            game.state.questionState === "open"
            && game.state.currentQuestion.bonus
            && game.state.currentQuestion.teamId === myMember.team?.id
            && memberId === myMember.id
        ) {
            gameStore.enableBuzzing()
        } else if (
            game.state.questionState === "open"
            && game.state.currentQuestion.bonus
            && game.state.currentQuestion.teamId === myMember.team?.id
        ) {
            gameStore.disableBuzzing()
        }
        // Chat message handled by Convex (from PlayerControls.svelte)
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
