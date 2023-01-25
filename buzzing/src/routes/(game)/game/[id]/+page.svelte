<script lang="ts">
    import MemberList from "$lib/components/MemberList.svelte";
    import Chatbox from '$lib/components/Chatbox.svelte'
    import TopBar from '$lib/components/TopBar.svelte'
    import MobileTopBar from '$lib/components/MobileTopBar.svelte'
    import Timer from '$lib/components/Timer.svelte'
    import PlayerControls from '$lib/components/PlayerControls.svelte'
    import ReaderControls from '$lib/components/ReaderControls.svelte'
    import Scoreboard from '$lib/components/Scoreboard.svelte'

    import type { TeamData } from '$lib/classes/Team'
    import type { PageData } from "./$types"
    import { browser } from '$app/environment'

    import { goto } from '$app/navigation';
    import Debugger from '$lib/classes/Debugger';
    import { setContext } from 'svelte';
    import socket from '$lib/stores/socket';
    import type { GameInfo } from '$lib/stores/gameInfo';
    import gameInfoStore from "$lib/stores/gameInfo";
    import membersStore from "$lib/stores/members";
    import teamsStore from "$lib/stores/teams";
    import timerStore from "$lib/stores/timer"
    import gameStateStore from "$lib/stores/gameState";
    import type { MemberData } from "$lib/classes/Member";
    import moderatorStore from "$lib/stores/moderators";

    export let data: PageData
    $: ({ gameInfo, teamList, moderatorList } = data)

    $gameInfoStore = gameInfo
    $teamsStore = teamList
    $moderatorStore = moderatorList

    let windowWidth: number

    const debug = browser ? new Debugger($gameInfoStore.gameId, gameInfo.gameName, $gameInfoStore.myMember, $socket) : null
    setContext('debug', debug)
    

    $socket.on('authenticated', () => {
    })

    $socket.on('authFailed', () => {
        goto('/join/' + $gameInfoStore.gameId)
    })

    $socket.on('gameEnd', () => {
        goto('/')
    })
</script>

<svelte:head>
    <title>{gameInfo.gameName}</title>
</svelte:head>

<svelte:window bind:innerWidth={windowWidth}></svelte:window>

<main>
    <svelte:component this={windowWidth > 500 ? TopBar : MobileTopBar} gameName={gameInfo.gameName} joinCode={gameInfo.joinCode}>
        <Timer bind:this={$timerStore} on:end={() => $gameStateStore = { ...$gameStateStore, buzzingDisabled: true }} />
    </svelte:component>
    <MemberList />
    <Scoreboard teamList={$teamsStore} buzzedTeamIDs={$gameStateStore.buzzedTeamIDs} />
    <Chatbox />

    {#if $gameInfoStore.myMember.moderator}
        <ReaderControls socket={socket} bind:questionState={$gameStateStore.questionState} />
    {:else}
        <PlayerControls />
    {/if}

    <div on:click={() => debug.openDebugLog()}
        style="position: fixed; right: 10px; bottom: 10px; cursor: pointer; background:grey; border-radius:1em; padding:.2em;">Open Debug Log</div>
</main>



<style lang="scss">
    main {
        display: grid;
        grid-template-columns: .1fr 1fr 1fr 1fr .1fr;
        grid-template-rows: max(10vh, 80px) auto auto;
        grid-template-areas: 
            "top-bar top-bar top-bar top-bar top-bar"
            ". member-list scoreboard chat-box ."
            ". control-panel control-panel control-panel .";
        column-gap: 1em;
        row-gap: 1em;
        justify-self: stretch;

        @media (max-width: 800px) {
            grid-template-columns: .1fr 1fr 1fr .1fr;
            grid-template-rows: max(10vh, 80px) auto auto auto;
            grid-template-areas: 
                "top-bar top-bar top-bar top-bar"
                ". chat-box chat-box ."
                ". control-panel control-panel ."
                ". member-list scoreboard .";
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