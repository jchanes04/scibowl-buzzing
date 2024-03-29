<script lang="ts">
    import MemberList from "../../MemberList.svelte";
    import Chatbox from '../../Chatbox.svelte'
    import TopBar from '$lib/components/TopBar.svelte'
    import Timer from '../../Timer.svelte'
    import Scoreboard from '../../Scoreboard.svelte'

    import type { PageServerData } from "./$types"

    import gameStore from "$lib/stores/game";
    import teamsStore, { createTeamStore } from "$lib/stores/teams";
    import playersStore, { createPlayerStore } from "$lib/stores/players";
    import moderatorsStore, { createModeratorStore } from "$lib/stores/moderators";
    import { page } from "$app/stores";
    import { createSocket } from "$lib/socket";
    import { beforeNavigate, invalidateAll } from "$app/navigation";
    import SpectatorScoreboard from "../SpectatorScoreboard.svelte";

    export let data: Required<PageServerData>
    let { gameInfo, teamList, moderatorList, playerList, scores } = data
    $: ({ gameInfo, teamList, moderatorList, playerList, scores } = data)

    const socket = createSocket(true)
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

    for (const t of Object.values(teamList)) {
        const newStore = createTeamStore(t)
        teamsStore.addTeam(newStore)
    }

    for (const p of Object.values(playerList)) {
        const team = $teamsStore[p.teamID]
        if (team) {
            const player = createPlayerStore(p, team.store)
            team.store.addPlayer(player)
            playersStore.addPlayer(player)
        }
    }

    for (const m of Object.values(moderatorList)) {
        const moderator = createModeratorStore(m)
        moderatorsStore.addModerator(moderator)
    }

    beforeNavigate(() => {
        socket.disconnect()
        invalidateAll()
    })
</script>

<svelte:head>
    <title>{gameInfo.name}</title>
</svelte:head>

<main>
    <TopBar gameName={gameInfo.name} joinCode="X" spectator={true}>
        <Timer />
    </TopBar>
    <MemberList />
    <SpectatorScoreboard />
    <Chatbox />
</main>

<style lang="scss">
    main {
        display: grid;
        grid-template-columns: .1fr 1fr 1fr .1fr;
        grid-template-rows: max(10vh, 80px) auto;
        grid-template-areas: 
            "top-bar top-bar top-bar top-bar"
            ". member-list chat-box ."
            ". scoreboard scoreboard .";
        column-gap: 1em;
        row-gap: 1em;
        justify-self: stretch;

        @media (max-width: 500px) {
            grid-template-columns: .05fr 1fr.05fr;
            grid-template-rows: max(10vh, 80px) auto auto auto;
            grid-template-areas: 
                "top-bar top-bar top-bar"
                ". chat-box ."
                ". scoreboard ."
                ". member-list .";
        }
    }
</style>