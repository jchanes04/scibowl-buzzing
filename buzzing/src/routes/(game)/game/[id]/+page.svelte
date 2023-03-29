<script lang="ts">
    import MemberList from "$lib/components/MemberList.svelte";
    import Chatbox from '$lib/components/Chatbox.svelte'
    import TopBar from '$lib/components/TopBar.svelte'
    import Timer from '$lib/components/Timer.svelte'
    import PlayerControls from '$lib/components/PlayerControls.svelte'
    import ReaderControls from '$lib/components/ReaderControls.svelte'
    import Scoreboard from '$lib/components/Scoreboard.svelte'

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
    import { beforeNavigate, invalidateAll } from "$app/navigation";

    export let data: PageServerData
    let { gameInfo, teamList, moderatorList, playerList, myMemberId, scores } = data
    $: ({ gameInfo, teamList, moderatorList, playerList, myMemberId, scores } = data)

    const socket = createSocket()
    playersStore.clear()
    moderatorsStore.clear()
    teamsStore.clear()

    $gameStore = {
        id: $page.params.id,
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
        if ($teamsStore[p.teamID]) {
            const team = $teamsStore[p.teamID]
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

    const debug = browser ? new Debugger($page.params.id, gameInfo.name, $myMemberStore, socket) : null
    setContext('debug', debug)

    beforeNavigate(() => {
        socket.disconnect()
        invalidateAll()
    })
</script>

<svelte:head>
    <title>{gameInfo.name}</title>
</svelte:head>

<main>
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
                "top-bar top-bar top-bar"
                ". chat-box ."
                ". control-panel ."
                ". scoreboard ."
                ". member-list .";
        }
    }
</style>