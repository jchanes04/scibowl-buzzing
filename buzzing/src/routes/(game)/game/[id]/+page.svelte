<script lang="ts">
    import MemberList from "../../MemberList.svelte";
    import Chatbox from '../../Chatbox.svelte'
    import TopBar from '$lib/components/TopBar.svelte'
    import Timer from '../../Timer.svelte'
    import PlayerControls from '../PlayerControls.svelte'
    import ReaderControls from '../ReaderControls.svelte'
    import Scoreboard from '../../Scoreboard.svelte'

    import type { PageServerData } from "./$types"
    import { browser } from '$app/environment'

    import Debugger from '$lib/classes/Debugger';
    import { setContext } from 'svelte';
    import gameStore from "$lib/stores/game";
    import teamsStore, { createTeamStore } from "$lib/stores/teams";
    import playersStore, { createPlayerStore } from "$lib/stores/players";
    import moderatorsStore, { createModeratorStore } from "$lib/stores/moderators";
    import myMemberStore from "$lib/stores/myMember"
    import { page } from "$app/stores";
    import { createSocket } from "$lib/socket";
    import { beforeNavigate } from "$app/navigation";

    export let data: PageServerData
    let { gameInfo, teamList, moderatorList, playerList, myMemberId, scores } = data
    $: ({ gameInfo, teamList, moderatorList, playerList, myMemberId, scores } = data)

    const socket = createSocket()
    playersStore.clear()
    moderatorsStore.clear()
    teamsStore.clear()

    $gameStore = {
        ...gameInfo,
        state: {
            questionState: 'idle',
            currentBuzzer: null,
            currentQuestion: null,
            buzzingEnabled: false,
            buzzedTeamIds: []
        },
        scores
    }
    gameStore.scoreboard.setScores(scores)

    for (const t of Object.values(teamList)) {
        const newStore = createTeamStore(t)
        teamsStore.addTeam(newStore)
    }

    for (const p of Object.values(playerList)) {
        const team = $teamsStore[p.teamID]
        if (team) {
            const player = createPlayerStore(p, team.store)
            if (p.id === myMemberId) {
                myMemberStore.setMember({ memberStore: player, moderator: false })
            }
            team.store.addPlayer(player)
            playersStore.addPlayer(player)
        }
    }

    for (const m of Object.values(moderatorList)) {
        const moderator = createModeratorStore(m)
        moderatorsStore.addModerator(moderator)
        if (m.id === myMemberId) {
            myMemberStore.setMember({ memberStore: moderator, moderator: true })
        }
    }

    const debug = browser ? new Debugger(gameInfo.id, gameInfo.name, $myMemberStore, socket) : null
    setContext('debug', debug)

    $: buzzed = $gameStore.state.questionState === 'buzzed' && $gameStore.state.currentBuzzer?.id === $myMemberStore.id

    beforeNavigate(() => {
        socket.disconnect()
    })
</script>

<svelte:head>
    <title>{gameInfo.name}</title>
</svelte:head>

<main class:buzzed>
    <TopBar gameName={gameInfo.name} joinCode={gameInfo.joinCode}>
        <Timer on:end={() => gameStore.disableBuzzing()} />
    </TopBar>
    <MemberList />
    <Scoreboard />
    <Chatbox />

    {#if $myMemberStore.moderator}
        <ReaderControls />
    {:else}
        <PlayerControls />
    {/if}

    <button on:click={() => debug?.openDebugLog()}
        style="position: fixed; right: 10px; bottom: 10px; cursor: pointer; background:grey; border-radius:1em; padding:.2em;">Open Debug Log</button>
</main>



<style lang="scss">
    @use '$styles/_global.scss' as *;

    @keyframes pulse {
        0% {
            box-shadow: inset 0 0 30px 10px $primary;
        }
        50% {
            box-shadow: inset 0 0 50px 20px $primary;
        }
        100% {
            box-shadow: inset 0 0 30px 10px $primary;
        }
    }

    main {
        position: relative;
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

        &.buzzed::before {
            content: '';
            position: absolute;
            top: max(10vh, 80px);
            left: 0;
            right: 0;
            bottom: -1em;
            box-shadow: inset 0 0 30px 10px $primary;
            pointer-events: none;
            z-index: 1;
            animation: pulse 2s infinite;
        }

        @media (max-width: 800px) {
            grid-template-columns: .1fr 1fr 1fr .1fr;
            grid-template-rows: max(10vh, 80px) auto auto auto;
            grid-template-areas: 
                "top-bar top-bar top-bar top-bar"
                ". chat-box chat-box ."
                ". control-panel control-panel ."
                ". member-list scoreboard .";

            &.buzzed::before {
                top: max(10vh, 80px);
            }
        }

        @media (max-width: 500px) {
            grid-template-columns: .05fr 1fr.05fr;
            grid-template-rows: max(10vh, 80px) auto auto auto auto;
            grid-template-areas: 
                "top-bar top-bar top-bar"
                ". chat-box ."
                ". control-panel ."
                ". scoreboard ."
                ". member-list .";

            &.buzzed::before {
                top: max(10vh, 80px);
            }
        }
    }
</style>