<script context="module" lang="ts">
    export async function load({ page, fetch }: LoadInput) {

        let res = await fetch(`/api/game/${page.params.id}`)

        if (res.ok) {
            let json = await res.json()
            return {
                props: {
                    ...json,
                    gameID: page.params.id
                }
            }
        }

        return {}
    }
</script>

<script lang="ts">
    export let memberList: MemberClean[]
    export let teamList: Array<TeamClean | IndividualTeamClean>
    export let gameName: string
    export let gameID: string
    export let joinCode: string
    export let chatMessages: Message[]
    let reader: boolean
    let buzzedTeamIDs: string[] = []

    type Message = {
        text: string
        type: 'buzz' | 'notification' | 'warning' | 'success'
    }

    import { writable } from 'svelte/store'
    import type { Writable } from 'svelte/store'
    export const messages: Writable<Message[]> = writable(chatMessages)

    import MemberList from "$lib/components/MemberList.svelte";
    import Chatbox from '$lib/components/Chatbox.svelte'
    import TopBar from '$lib/components/TopBar.svelte'
    import Timer from '$lib/components/Timer.svelte'
    import PlayerControls from '$lib/components/PlayerControls.svelte'
    import ReaderControls from '$lib/components/ReaderControls.svelte'
    import Scoreboard from '$lib/components/Scoreboard.svelte'

    import type { LoadInput } from "@sveltejs/kit";
    import type { MemberClean } from "$lib/classes/Member";
    import type { IndividualTeamClean } from '$lib/classes/IndividualTeam';
    import type { TeamClean } from '$lib/classes/Team'
    import type { Message, Question } from "$lib/classes/Game"
    import { io } from 'socket.io-client'
    import Cookie from 'js-cookie'
    import { browser } from '$app/env'

    import { time } from "$lib/components/Timer.svelte"
    let timer

    let joined = false
    const myMemberID = Cookie.get('memberID')
    const myMember = memberList.find(m => m.id === myMemberID)
    const myTeam = teamList.find(x => x.id === myMember?.teamID)

    const socket = writable(io("http://localhost:3030", {
        auth: {
            memberID: myMemberID,
            gameID
        },
        autoConnect: false
    }))
    if (browser) {
        $socket.connect()
    }

    $socket.on('authenticated', (data) => {
        reader = data.reader
        joined = true
    })

    $socket.on('authFailed', () => {
        window.location.href = '/join/' + gameID
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
        if (team.members.length === 1) {
            teamList = teamList.filter(t => t.id !== team.id)
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

        buzzedTeamIDs = [...buzzedTeamIDs, member.teamID]

        $messages = [...$messages, {
            type: 'buzz',
            text: member.name + ' has buzzed'
        }]
        
        timer.pause()
    })

    $socket.on('questionOpen', (question: Question) => {
        buzzedTeamIDs = []
        playerControls?.enableBuzzing()
        $messages = [...$messages, {
            type: 'notification',
            text: 'new question opened'
        }]
    })

    $socket.on('buzzFailed', () => {

    })

    $socket.on('timerStart', (length: number) => {
        timer.start(length)
        playerControls?.enableBuzzing()
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
            if (buzzedTeamIDs.includes(myTeam.id)) {
               playerControls?.disableBuzzing()
            } else {
                playerControls?.enableBuzzing()
            }
        } else {
            timer.reset()
            playerControls?.disableBuzzing()
        }
    })

    let playerControls
    function buzz() {
        $socket.emit('buzz');

        playerControls?.disableBuzzing()
        buzzedTeamIDs.push(myTeam.id)

        timer.pause()

        $messages = [...$messages, {
            type: 'buzz',
            text: 'You have buzzed'
        }]
    }
</script>

<div id="game">
    {#if joined}
        <TopBar gameName={gameName} joinCode={joinCode} >
            <Timer bind:this={timer} on:end={() => playerControls?.disableBuzzing()} />
        </TopBar>
        <MemberList memberList={memberList} />
        <Scoreboard teamList={teamList} buzzedTeamIDs={buzzedTeamIDs} />
        <Chatbox messages={messages} />

        {#if reader}
            <ReaderControls socket={socket} messages={messages} />
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
        grid-template-rows: max(10vh, 80px) 1fr 1fr;
        grid-template-areas: 
            "top-bar top-bar top-bar top-bar top-bar"
            ". member-list scoreboard chat-box ."
            ". control-panel control-panel control-panel .";
        height: 95vh;
    }
</style>