import { browser } from "$app/environment"
import { io, Socket } from "socket.io-client"
import teamsStore, { createTeam, type ClientTeamData } from "./stores/teams.svelte"
import playersStore, { createPlayer, type ClientPlayer } from "./stores/players.svelte"
import myMemberStore from "./stores/myMember.svelte"
import chatMessagesStore, { type ChatMessage } from "./stores/chatMessages.svelte"
import gameStore from "./stores/game.svelte"
import scoreboard from "./stores/scoreboard.svelte"
import { timerStore, gameClockStore } from "./stores/timer.svelte"
import moderatorsStore, { createModerator } from "./stores/moderators.svelte"
import visualBonusStore from "./stores/visualBonus.svelte"
import { goto, invalidateAll } from "$app/navigation"
import type { Category, NewQuestionData, ScoreType } from "$lib/classes/Game"
import type { ModeratorData } from "$lib/classes/Moderator"
import type { PlayerData } from "$lib/classes/Player"
import type { TeamData } from "$lib/classes/Team"
import { env } from "$env/dynamic/public"

// Direct access to store values via getters
const getTeams = () => teamsStore.value
const getPlayers = () => playersStore.value
const getModerators = () => moderatorsStore.value
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
        chatMessagesStore.add({
            type: 'notification',
            text: name + ' has joined the game'
        })
    })

    socket.on('playerJoin', ({ player, team }: { player: PlayerData, team: TeamData }) => {
        let playerTeam = getTeams()[team.id]
        if (!playerTeam) {
            playerTeam = createTeam(team)
            teamsStore.addTeam(playerTeam)
        }
        const newPlayer = createPlayer(player, playerTeam)
        teamsStore.addPlayerToTeam(team.id, newPlayer)
        playersStore.addPlayer(newPlayer)

        chatMessagesStore.add({
            type: 'notification',
            text: player.name + ' has joined the game'
        })
    })

    socket.on('memberRejoin', ({ member, team }: { member: PlayerData | ModeratorData, team: TeamData }) => {
        if (member.type === "moderator") {
            const newModerator = createModerator(member)
            moderatorsStore.addModerator(newModerator)
        } else {
            let playerTeam = getTeams()[team.id]
            if (!playerTeam) {
                playerTeam = createTeam(team)
                teamsStore.addTeam(playerTeam)
            }
            const newPlayer = createPlayer(member, playerTeam)
            teamsStore.addPlayerToTeam(team.id, newPlayer)
            playersStore.addPlayer(newPlayer)
        }
        chatMessagesStore.add({
            type: 'notification',
            text: member.name + ' has rejoined the game'
        })
    })

    socket.on('memberLeave', id => {
        const player = getPlayers()[id]
        const moderator = getModerators()[id]

        if (moderator) {
            moderatorsStore.removeModerator(id)
            chatMessagesStore.add({
                type: 'notification',
                text: moderator.name + ' has left the game'
            })
        } else if (player) {
            const teams = getTeams()
            playersStore.removePlayer(id)
            if (teams[player.team.id]?.type !== "default" && Object.values(teams[player.team.id]!.players).length === 1) {
                teamsStore.removeTeam(player.team.id)
            } else {
                teamsStore.removePlayerFromTeam(player.team.id, id)
            }
            chatMessagesStore.add({
                type: 'notification',
                text: player.name + ' has left the game'
            })
        }
    })

    socket.on('promotion', async (memberId: string) => {
        const player = getPlayers()[memberId]
        const team = player?.team
        if (team && player) {
            teamsStore.removePlayerFromTeam(team.id, player.id)
            playersStore.removePlayer(player.id)
            const newModerator = createModerator({
                id: memberId,
                name: player.name,
                type: "moderator"
            })
            moderatorsStore.addModerator(newModerator)
            chatMessagesStore.add({
                type: 'notification',
                text: player.name + ' has been promoted to a moderator'
            })

            const myMember = getMyMember()
            if (player.id === myMember.id) {
                myMemberStore.setModerator(newModerator)
                socket.once("disconnect", async () => {
                    await invalidateAll()
                    socket.connect()
                })
                socket.disconnect()
            }
        }
    })

    socket.on('nameChange', (id: string, name: string) => {
        playersStore.renamePlayer(id, name)
    })

    socket.on('buzz', (id: string) => {
        const player = getPlayers()[id]
        if (player) {
            gameStore.buzz(player.team.id, player)
            buzzAudio?.play()
            timerStore.pause()

            chatMessagesStore.add({
                type: 'buzz',
                text: player.name + ' has buzzed'
            })
        }
    })

    socket.on('buzzAccept', () => {
        chatMessagesStore.add({
            type: "buzz",
            text: "You have buzzed"
        })
    })

    socket.on('buzzFailed', () => {
        const myMember = getMyMember()
        if (myMember.team) gameStore.removeTeamBuzz(myMember.team.id)
        chatMessagesStore.add({
            type: "warning",
            text: "You have been outbuzzed"
        })
    })

    socket.on('scoresClear', () => {
        scoreboard.clear()
        chatMessagesStore.add({
            type: "notification",
            text: "Scores cleared"
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

        if (scoreType === "correct") {
            if (bonus) {
                scoreboard.correctBonus(number, teamId, category)
            } else {
                scoreboard.correctTossup(number, playerId, teamId, category)
            }

            chatMessagesStore.add({
                type: 'success',
                text: `Correct answer (${(category[0] || "").toUpperCase() + category.slice(1)})`
            })
        } else if (scoreType === "incorrect") {
            if (bonus) {
                scoreboard.incorrectBonus(number, teamId, category)
            } else {
                scoreboard.incorrectTossup(number, playerId, teamId, category)
            }

            chatMessagesStore.add({
                type: 'warning',
                text: 'Incorrect answer'
            })
        } else if (scoreType === "penalty") {
            if (!bonus) {
                scoreboard.penalty(number, playerId, teamId, category)
            }

            chatMessagesStore.add({
                type: 'warning',
                text: 'Penalty applied'
            })
        }

        const myMember = getMyMember()
        if (open && game.state.currentQuestion) {
            if (myMember.team && game.state.buzzedTeamIds.includes(myMember.team.id)) {
                gameStore.openQuestion(false)
            } else {
                gameStore.openQuestion(true)
            }
        } else {
            chatMessagesStore.add({
                type: 'notification',
                text: `${myMember.team?.id}, ${game.state.buzzedTeamIds}, ${game.state.currentQuestion?.bonus}`
            })
            timerStore.end()
            gameStore.clearQuestion()
        }
    })

    socket.on("deadQuestion", (number: number, category: Category) => {
        scoreboard.dead(number, category)
        timerStore.end()
        gameStore.clearQuestion()
        chatMessagesStore.add({
            type: "warning",
            text: "Question marked dead"
        })
    })

    socket.on('tossupEdit', (
        number: number,
        playerId: string,
        teamId: string,
        category: Category,
        scoreType: ScoreType | "none"
    ) => {
        scoreboard.editTossup(
            number,
            playerId,
            teamId,
            category,
            scoreType
        )
    })

    socket.on("bonusEdit", (
        number: number,
        teamId: string,
        scoreType: "correct" | "incorrect" | "none"
    ) => {
        scoreboard.editBonus(
            number,
            teamId,
            scoreType
        )
    })

    socket.on("questionDelete", (number: number) => {
        scoreboard.deleteQuestion(number)
    })

    socket.on('questionOpen', (question: NewQuestionData) => {
        const myMember = getMyMember()
        const teams = getTeams()
        const buzzingEnabled = !question.bonus || !!(question.teamId && question.teamId === myMember.team?.id && teams[question.teamId]?.captainId === myMember.id)
        gameStore.newQuestion(question, buzzingEnabled)

        if (!question.bonus && question.number && scoreboard.value[question.number]) {
            scoreboard.clearQuestion(question.number)
        }

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

        const teamName = teams[question.bonus ? question.teamId : ""]?.name
        if (question.number) {
            chatMessagesStore.add({
                type: "notification",
                text: `${question.bonus ? "Bonus" : "Tossup"} #${question.number} opened` + (teamName ? " for " + teamName : "")
            })
        } else {
            chatMessagesStore.add({
                type: 'notification',
                text: `New ${question.bonus ? "bonus" : "tossup"} opened` + (teamName ? " for " + teamName : "")
            })
        }
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

    socket.on('timerStart', (length: number) => {
        timerStore.start(length)
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
            chatMessagesStore.add({
                type: 'warning',
                text: "Time is up"
            })
        }
        gameStore.stopQuestion()
    })

    socket.on("gameClockStart", (length: number) => {
        gameClockStore.start(length)
        chatMessagesStore.add({
            type: "notification",
            text: `${Math.floor(length / 60).toString().padStart(2, "0")}:${(length % 60).toString().padStart(2, "0")} game clock started`
        })
    })

    socket.on("gameClockUpdate", (length: number) => {
        gameClockStore.start(length)
    })

    socket.on("gameClockPause", () => {
        gameClockStore.pause()
        chatMessagesStore.add({
            type: "notification",
            text: "Game clock paused"
        })
    })

    socket.on("gameClockResume", () => {
        gameClockStore.resume()
        chatMessagesStore.add({
            type: "notification",
            text: "Game clock resumed"
        })
    })

    socket.on("gameClockEnd", () => {
        gameClockStore.end()
        chatMessagesStore.add({
            type: "notification",
            text: "Game clock ended"
        })
    })

    socket.on("gameClockStop", () => {
        gameClockStore.stop()
        chatMessagesStore.add({
            type: "notification",
            text: "Game clock stopped"
        })
    })

    socket.on('changeCaptain', (teamId: string, memberId: string) => {
        const teams = getTeams()
        const team = teams[teamId]
        if (!team) return

        teamsStore.changeCaptain(teamId, memberId)

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

        chatMessagesStore.add({
            type: "notification",
            text: member.name + " is now captain of " + team.name
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

    socket.on('gameEnd', () => {
        goto('/')
        socket.disconnect()
    })

    return socket
}

export default () => existingSocket