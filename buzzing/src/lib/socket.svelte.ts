import { browser } from "$app/environment"
import { io, Socket } from "socket.io-client"
import chatMessagesStore, { type ChatMessage } from "./stores/chatMessages"
import gameStore, { type ClientGameData } from "./stores/game"
import { timerStore, gameClockStore } from "./stores/timer"
import visualBonusStore from "./stores/visualBonus"
import { goto, invalidateAll } from "$app/navigation"
import type { Category, NewQuestionData, ScoreType } from "$lib/classes/Game"
import { env } from "$env/dynamic/public"
import { page } from "$app/state"

// Client classes
import type { ClientPlayerData } from "$lib/classes/client/ClientPlayer"
import type { ClientModeratorData } from "$lib/classes/client/ClientModerator"
import type { ClientTeamData } from "$lib/classes/client/ClientTeam"

// Convex
import { api } from "../../convex/_generated/api"
import { useQuery } from "convex-svelte"





let chatMessages: ChatMessage[]
chatMessagesStore.subscribe(value => chatMessages = value)

let game: ClientGameData
gameStore.subscribe(value => game = value)

let timer: number
timerStore.subscribe(value => timer = value)

let visualBonus: { url: string | null, window: Window | null }
visualBonusStore.subscribe(value => visualBonus = value)

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
    
    const memberId = $state(browser ? sessionStorage.getItem("memberId") : null);
    const rawModerators = useQuery(api.moderators.getByGameId, { gameId : page.params.id ?? "" });
    const moderators : ClientModeratorData[] = $derived(
        (rawModerators.data ?? []).map(mod => ({
            name: mod.name,
            id: mod.externalId,
            connected: mod.connected,
            type: "moderator"
        }))
    );

    const rawTeams = useQuery(api.teams.getByGameId, { gameId : page.params.id ?? "" });
    const teams : ClientTeamData[] = $derived(
        (rawTeams.data ?? []).map(team => ({
            id: team.externalId,
            name: team.name,
            type: team.type
        }))
    );

    const rawPlayers = useQuery(api.players.getByGameId, { gameId : page.params.id ?? "" });
    const players : ClientPlayerData[] = $derived(
        (rawPlayers.data ?? []).map(player => ({
            name: player.name,
            id: player.externalId,
            connected: player.connected,
            type: "player",
            team: teams.find(team => team.id === player.teamId)?.id ?? null,
            isCaptain: player.isCaptain ?? false
        }))
    );

    let myMember = $derived(players.find(p => p.id === memberId))

    

    socket.onAny((event: string, ...args: any[]) => {
        console.log(event, args);
    })

    socket.on('buzz', (id: string) => {
        const player = players.find(p => p.id === id)
        if (player) {
            gameStore.buzz(player.team ?? "", player.id)
            buzzAudio?.play()
            timerStore.pause()
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
        if (myMember?.team) gameStore.removeTeamBuzz(myMember.team)
        chatMessagesStore.update(oldList => {
            oldList.push({
                type: "warning",
                text: "You have been outbuzzed"
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
        const team = teams.find(t => t.id === teamId)

        if (!team) {
            return
        }

        if (bonus) {
            if (visualBonus.window) {
                visualBonus.window.close()
                visualBonusStore.set({
                    url: null,
                    window: null
                })
            }
        }

        if (open && game.state.currentQuestion) {
            if (myMember?.team && game.state.buzzedTeamIds.includes(myMember.team)) {
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
        timerStore.end()
        gameStore.clearQuestion()
    })

    socket.on('questionOpen', (question: NewQuestionData) => {
        const buzzingEnabled = !question.bonus 
            || !!(question.teamId && question.teamId === myMember?.team 
                && myMember.isCaptain)
        gameStore.newQuestion(question, buzzingEnabled)

        if (!question.bonus || !question.visual) {
            console.log("clearing")
            visualBonusStore.update(value => ({
                url: null,
                window: value.window
            }))
            if (visualBonus.window) visualBonus.window.document.body.innerHTML =
                `<style>
                    img {
                        width: 100%;
                    }
                </style>
                <div></div>`
        }
    })

    socket.on("visualBonusOpen", (data: Buffer) => {
        if (moderators.some(m => m.id === myMember?.id)) return

        const blob = new Blob([new Uint8Array(data)])
        const url = URL.createObjectURL(blob)
        visualBonusStore.update(value => ({
            url,
            window: value.window
        }))
    })

    socket.on('timerStart', (length: number) => {
        timerStore.start(length)
        const tossupOpen = !game.state.currentQuestion?.bonus && !game.state.buzzedTeamIds.includes(myMember?.team ?? "")
        const bonusOpen = !!game.state.currentQuestion?.bonus
            && (game.state.currentQuestion?.teamId === myMember?.team
                && (myMember?.isCaptain 
                    || !players.some(p => p.team === myMember?.team && p.isCaptain)))
        const questionOpen = !moderators.some(m => m.id === myMember?.id) 
                               && (tossupOpen || bonusOpen)
        gameStore.openQuestion(questionOpen)
    })

    socket.on('timerEnd', () => {
        gameStore.stopQuestion()
    })

    socket.on("gameClockStart", (length: number) => {
        gameClockStore.start(length)
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

    // Note: changeCaptain socket event removed - captain changes are now via Convex
    // The subscription will automatically update myMember.isCaptain
    // Chat message is sent by the Convex mutation

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