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
    export let memberList: Member[]
    export let gameName: string
    export let gameID: string
    export let chatMessages: Message[]
    let reader: boolean

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
    import type { Member } from "$lib/classes/Member";
    import type { Message, Question } from "$lib/classes/Game"
    import { io } from 'socket.io-client'
    import Cookie from 'js-cookie'

    import { time } from "$lib/components/Timer.svelte"
    let timer

    let joined = false
    const memberID = Cookie.get('memberID')

    const socket = writable(io("http://localhost:3030", {
        auth: {
            memberID: memberID,
            gameID
        } 
    }))

    $socket.on('authenticated', (data) => {
        reader = data.reader
        joined = true
    })

    // $socket.on('authFailed', () => {
    //     window.location.href = '/join/' + gameID
    // })

    $socket.on('memberJoin', (member: Member) => {
        memberList = [...memberList, member]
        $messages = [...$messages, {
            type: 'notification',
            text: member.name + ' has joined'
        }]
    })

    $socket.on('memberLeave', id => {
        let member = memberList.find(x => x.id === id)
        memberList = memberList.filter(x => x.id !== id)
        $messages = [...$messages, {
            type: 'notification',
            text: member.name + ' has left'
        }]
    })

    $socket.onAny((event: string, ...args: any[]) => {
        console.log(event, args);
    })

    $socket.on('buzz', (id) => {
        let member = memberList.find(x => x.id === id);
        if (<HTMLInputElement>document.getElementById("buzz")){
            (<HTMLInputElement>document.getElementById("buzz")).disabled = true
        } 
        $messages = [...$messages, {
            type: 'buzz',
            text: member.name + ' has buzzed'
        }]
        timer.pause()
    })

    $socket.on('questionOpen', (question: Question) => {
        buzzingDisabled = false
        buzzingLockout = false
        $messages = [...$messages, {
            type: 'notification',
            text: 'new question opened'
        }]
    })

    $socket.on('buzzFailed', () => {
        
    })

    $socket.on('timerStart', (length: number) => {
        timer.start(length)
        buzzingDisabled = false
    })

    $socket.on('timerEnd', () => {
        timer.end()

        buzzingDisabled = true
    })

    $socket.on('scoreChange', ({ score, memberID, memberScore }: { score: 'correct' | 'incorrect' | 'penalty', memberID: string, memberScore: number }) => {
        let member = memberList.find(x => x.id === memberID)
        console.log(score)
        console.log(memberScore)
        if (member) {
            member.scoreboard.score = memberScore
            memberList = memberList
        }
        if (score === "correct") {
           timer.end()
        } else if (score === "incorrect") {
            timer.resume()
        } else if (score === "penalty") {
            timer.resume()
        }
    })

    let buzzingDisabled = true
    let buzzingLockout = false
    function buzz() {
        $socket.emit('buzz');
        buzzingDisabled = true
        buzzingLockout = true
        timer.pause()
        $messages = [...$messages, {
            type: 'buzz',
            text: 'You have buzzed'
        }]
    }
</script>

<div id="game">
    {#if joined}
        <TopBar gameName={gameName}>
            <Timer bind:this={timer} on:end={() => buzzingDisabled = true} />
        </TopBar>
        <MemberList memberList={memberList} />
        <Scoreboard memberList={memberList} />
        <Chatbox messages={messages} />

        {#if reader}
            <ReaderControls socket={socket} messages={messages} />
        {:else}
            <PlayerControls buzz={buzz} buzzingDisabled={buzzingDisabled || buzzingLockout} />
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
    }

    .gamediv {
        border-color: black;
        border-width: 2px;
    }

    .reader-label {
        color: #f09231;
    }

    #scoreboard {
        grid-area: scoreboard;
        border-left-style: solid;
        border-top-style: solid;
        border-right-style: solid;
        position: relative;
    }

    #scoreboard h2 {
        display: inline-block;
    }

    #chatbox {
        width: 30%;
        min-height: 200px;
        max-height: 400px;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        border-top-style: solid;
        border-right-style: solid;
    }


    
    #control-panel {
        grid-area: control-panel;
        padding: 20px 20px 20px 20px;
        height: 200px;
        border-style:solid ;
    }

    #timer {
        position: absolute;
        top: 10px;
        right: 20px;
        display: none;
        font-size: 54px;
        margin-block-start: 0em;
        margin-block-end: 0em;
    }
</style>