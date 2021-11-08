<script context="module" lang="ts">
    export async function load({ page, fetch }: LoadInput) {

        let res = await fetch(`/api/game/${page.params.id}`)

        if (res.ok) {
            let json = await res.json()
            return {
                props: {
                    gameInfo: {
                        ...json?.gameInfo,
                        gameID: page.params.id
                    },
                    memberList: json.memberList,
                    teamList: json.teamList
                }
            }
        }

        return {}
    }
</script>

<script lang="ts">
    export let gameInfo: GameInfo
    export let memberList: MemberClean[]
    export let teamList: Array<TeamClean | IndividualTeamClean>
    let reader: boolean
    let state: GameState = {
        questionState: 'idle',
        buzzedTeamIDs: []
    }
    let chatMessages: Message[] = []

    let windowWidth: number

    type Message = {
        text: string
        type: 'buzz' | 'notification' | 'warning' | 'success'
    }

    type GameInfo = {
        gameName: string,
        gameID: string,
        joinCode: string,
        teamFormat: 'any' | 'individuals' | 'teams'
    }

    type GameState = {
        questionState: 'idle' | 'open' | 'buzzed',
        buzzedTeamIDs: string[]
    }

    import { writable } from 'svelte/store'
    import type { Writable } from 'svelte/store'
    export const messages: Writable<Message[]> = writable(chatMessages)

    import MemberList from "$lib/components/MemberList.svelte";
    import Chatbox from '$lib/components/Chatbox.svelte'
    import TopBar from '$lib/components/TopBar.svelte'
    import MobileTopBar from '$lib/components/MobileTopBar.svelte'
    import Timer from '$lib/components/Timer.svelte'
    import PlayerControls from '$lib/components/PlayerControls.svelte'
    import ReaderControls from '$lib/components/ReaderControls.svelte'
    import Scoreboard from '$lib/components/Scoreboard.svelte'

    import type { LoadInput } from "@sveltejs/kit";
    import type { MemberClean } from "$lib/classes/Member";
    import type { IndividualTeamClean } from '$lib/classes/IndividualTeam';
    import type { TeamClean } from '$lib/classes/Team'
    import { emptyCatScores } from '$lib/classes/TeamScoreboard'
    import type { Game, Message, Question } from "$lib/classes/Game"
    import { io } from 'socket.io-client'
    import Cookie from 'js-cookie'
    import { browser } from '$app/env'

    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    let timer

    let buzzAudio = browser ? new Audio('/buzz.mp3') : null

    let joined = false
    const myMemberID = Cookie.get('memberID')
    const myMember = memberList.find(m => m.id === myMemberID)
    const myTeam = teamList.find(x => x.id === myMember?.teamID)

    const socket = writable(io($page.host?.split(":")[0] + ":3030", {
        auth: {
            memberID: myMemberID,
            gameID: gameInfo.gameID
        },
        autoConnect: false,
        secure: true
    }))
    if (browser) {
        $socket.connect()
    }

    $socket.on('authenticated', (data) => {
        reader = data.reader
        joined = true
        Cookie.set("memberInfo",{
            name: myMember.name,
            id: myMemberID,
            score: myMember.scoreboard.score,
            catScores: myMember.scoreboard.catScores,
            teamID: myMember.teamID
        }, {path:"/",expires:0.1})
    })

    $socket.on('authFailed', () => {
        goto('/join/' + gameInfo.gameID)
    })

    $socket.on('memberJoin', ({ member, team }: { member: MemberClean, team: TeamClean | IndividualTeamClean }) => {
        memberList = [...memberList, member]
        if (!teamList.some(t => t.id === team.id)) {
            teamList = [...teamList, team]
        } else {
            teamList[teamList.findIndex(x => x.id === team.id)] = team
            teamList = [...teamList]
        }
        $messages = [...$messages, {
            type: 'notification',
            text: member.name + ' has joined the game'
        }]
    })

    $socket.on('memberLeave', id => {
        let member = memberList.find(x => x.id === id)
        let team = teamList.find(t => t.id === member.teamID)
        if (team.members.length === 1 && gameInfo.teamFormat !== 'teams') {
            teamList = teamList.filter(t => t.id !== team.id)
        } else {
            team.members = team.members.filter(x => x.id !== id)
            teamList = teamList
        }
        memberList = memberList.filter(x => x.id !== id)
        $messages = [...$messages, {
            type: 'notification',
            text: member.name + ' has left the game'
        }]
    })

    $socket.onAny((event: string, ...args: any[]) => {
        console.log(event, args);
    })

    $socket.on('buzz', (id) => {
        let member = memberList.find(x => x.id === id);
        playerControls?.disableBuzzing()
        state.questionState = 'buzzed'

        buzzAudio.play()

        state.buzzedTeamIDs = [...state.buzzedTeamIDs, member.teamID]

        $messages = [...$messages, {
            type: 'buzz',
            text: member.name + ' has buzzed'
        }]
        
        timer.pause()
    })

    $socket.on('questionOpen', (question: Question) => {
        if (question.team && question.team !== myTeam.id) {
            state.buzzedTeamIDs = [myTeam.id]
            playerControls?.disableBuzzing()
        } else {
            state.buzzedTeamIDs = []
            playerControls?.enableBuzzing()
        }
        state.questionState = 'open'
        $messages = [...$messages, {
            type: 'notification',
            text: 'New question opened' + (teamList.find(x => x.id === question.team) ? " for " + teamList.find(x => x.id === question.team)?.name : "")
        }]
    })

    $socket.on('buzzFailed', () => {

    })

    $socket.on('timerStart', (length: number) => {
        timer.start(length)
        if (!state.buzzedTeamIDs.includes(myTeam.id)) {
            playerControls?.enableBuzzing()
        } else {
            playerControls?.disableBuzzing()
        }
        state.questionState = 'open'
    })

    $socket.on('timerEnd', () => {
        if (timer.live()) {
            timer.end()
            $messages = [...$messages, {
                type: 'warning',
                text: "Time is up"
            }]
        }

        playerControls?.disableBuzzing()
        state.questionState = 'idle'
    })

    $socket.on('scoreChange', (
        { open, score, memberID, memberScore, teamID, teamScore }: 
        { open: boolean, score: 'correct' | 'incorrect' | 'penalty', memberID: string, memberScore: number, teamID: string, teamScore: number }
    ) => {
        let team = teamList.find(t => t.id === teamID)
        let member = memberList.find(m => m.id === memberID)
        if (member) {
            member.scoreboard.score = memberScore
            memberList = memberList
        }
        if (team) {
            team.scoreboard.score = teamScore
            teamList = teamList
        }

        if (score === "correct") {
            $messages = [...$messages, {
                type: 'success',
                text: 'Correct answer'
            }]
        } else if (score === "incorrect") {
            $messages = [...$messages, {
                type: 'warning',
                text: 'Incorrect answer'
            }]
        } else if (score === "penalty") {
            $messages = [...$messages, {
                type: 'warning',
                text: 'Penalty applied'
            }]
        }

        if (open) {
            timer.resume()
            state.questionState = 'open'
            if (state.buzzedTeamIDs.includes(myTeam.id)) {
               playerControls?.disableBuzzing()
            } else {
                playerControls?.enableBuzzing()
            }
        } else {
            timer.reset()
            state.questionState = 'idle'
            playerControls?.disableBuzzing()
        }

        Cookie.set("memberInfo",{
            name: myMember.name,
            id: myMemberID,
            score: myMember.scoreboard.score,
            catScores: myMember.scoreboard.catScores,
            teamID: myMember.teamID
        }, {path:"/",expires:0.1})
    })

    $socket.on('scoresClear', () => {
        teamList.forEach(t => {
            t.scoreboard.score = 0
            t.scoreboard.catScores = emptyCatScores()
        })
        memberList.forEach(m => {
            m.scoreboard.score = 0
            m.scoreboard.catScores = emptyCatScores()
        })
        memberList = memberList
        teamList = teamList

        $messages = [...$messages, {
            type: 'notification',
            text: 'Scores cleared'
        }]
    })

    $socket.on('scoresSaved', () => {
        $messages = [...$messages, {
            type: 'notification',
            text: "Scores saved successfully"
        }]
    })

    $socket.on('gameEnd', () => {
        goto('/')
    })

    let playerControls
    function buzz() {
        $socket.emit('buzz');

        buzzAudio.play()

        playerControls?.disableBuzzing()
        state.buzzedTeamIDs.push(myTeam.id)

        timer.pause()
        state.questionState = 'buzzed'

        $messages = [...$messages, {
            type: 'buzz',
            text: 'You have buzzed'
        }]
    }
</script>

<svelte:head>
    <title>{gameInfo.gameName}</title>
</svelte:head>

<svelte:body on:keydown={(e) => {
    let { code, keyCode } = e
    if ((code === "Space" || code === "Enter") && playerControls?.buzzingEnabled()) {
        buzz()
    } else if (code === null || code === undefined) {
        if ((keyCode === 32 || keyCode === 13) && playerControls?.buzzingEnabled()) {
            buzz()
        }
    }
}} />

<svelte:window bind:innerWidth={windowWidth}></svelte:window>

<div id="game">
    {#if joined}
        <svelte:component this={windowWidth > 500 ? TopBar : MobileTopBar} gameName={gameInfo.gameName} joinCode={gameInfo.joinCode}>
            <Timer bind:this={timer} on:end={() => playerControls?.disableBuzzing()} />
        </svelte:component>
        <MemberList memberList={memberList} />
        <Scoreboard teamList={teamList} buzzedTeamIDs={state.buzzedTeamIDs} />
        <Chatbox messages={messages} />

        {#if reader}
            <ReaderControls socket={socket} messages={messages} bind:questionState={state.questionState} teamList={teamList} />
        {:else}
            <PlayerControls buzz={buzz} bind:this={playerControls} />
        {/if}
    {:else}
        <h1>Joining...</h1>
    {/if}
</div>



<style lang="scss">
    #game {
        display: grid;
        grid-template-columns: .1fr 1fr 1fr 1fr .1fr;
        grid-template-rows: max(10vh, 80px) auto auto;
        grid-template-areas: 
            "top-bar top-bar top-bar top-bar top-bar"
            ". member-list scoreboard chat-box ."
            ". control-panel control-panel control-panel .";
        column-gap: 1em;
        row-gap: 1em;
        min-height: 95vh;

        @media (max-width: 800px) {
            grid-template-columns: .1fr 1fr 1fr .1fr;
            grid-template-rows: max(10vh, 80px) auto auto auto;
            grid-template-areas: 
                "top-bar top-bar top-bar top-bar"
                ". chat-box chat-box ."
                ". control-panel control-panel ."
                ". member-list scoreboard .";
            min-height: 130vh;
            margin-bottom: 1em;
        }

        @media (max-width: 500px) {
            grid-template-columns: .05fr 1fr.05fr;
            grid-template-rows: max(10vh, 80px) auto auto auto auto;
            grid-template-areas: 
                "mobile-top-bar mobile-top-bar mobile-top-bar"
                ". chat-box ."
                ". control-panel ."
                ". scoreboard ."
                ". member-list .";
        }
    }
</style>