<script lang="ts">
    import { scoreboardStore } from "$lib/stores/scoreboard.svelte";
    import {
        convertToCSV,
        convertToASCII,
        derivePlayerNames,
        deriveTeamNames,
        combinePlayersLists,
        getPlayersFromScores,
        getPlayersFromTeams,
    } from "$lib/functions/scoreboard";
    import Confirm from "$lib/components/Confirm.svelte";
    import { useConvexClient } from "convex-svelte";
    import { api } from "../../../convex/_generated/api";
    import gameIdStore from "$lib/stores/gameId.svelte";
    import ScoreboardTable from "./ScoreboardTable.svelte";
    import getSocket from "$lib/socket.svelte";
    import { modalStore } from "$lib/stores/modal.svelte";

    interface Props {
        isModerator?: boolean;
    }

    let { isModerator = false }: Props = $props();

    const convex = useConvexClient();
    const socket = getSocket();

    function getPlayersData() {
        const scoreboardData = scoreboardStore.value;
        if (!scoreboardData) return null;

        const derivedPlayerNames = derivePlayerNames(
            scoreboardData.members || {},
        );
        const derivedTeamNames = deriveTeamNames(scoreboardData.teams || {});
        const playersFromScores = getPlayersFromScores(scoreboardData.scores);
        const playersFromTeams = getPlayersFromTeams(
            derivedPlayerNames,
            derivedTeamNames,
        );
        const players = combinePlayersLists(
            playersFromScores,
            playersFromTeams,
        );

        return {
            scoreboardData,
            derivedPlayerNames,
            derivedTeamNames,
            players,
        };
    }

    async function exportScores() {
        const data = getPlayersData();
        if (!data) return;

        const csv = await convertToCSV(
            data.derivedTeamNames,
            data.derivedPlayerNames,
            data.players,
            data.scoreboardData.scores || {},
        );
        const url = window.URL.createObjectURL(
            new Blob([csv], { type: "plain/text" }),
        );
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "scores.csv";
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
    }

    let copyButtonText = $state("Copy as ASCII");

    async function copyAsASCII() {
        const data = getPlayersData();
        if (!data) return;

        const pointValues = data.scoreboardData.pointValues || {
            tossup: 4,
            bonus: 10,
            penalty: -4,
        };

        const ascii = convertToASCII(
            data.derivedTeamNames,
            data.derivedPlayerNames,
            data.players,
            data.scoreboardData.scores || {},
            pointValues,
        );

        try {
            await navigator.clipboard.writeText(ascii);
            copyButtonText = "Copied!";
            setTimeout(() => {
                copyButtonText = "Copy as ASCII";
            }, 2000);
        } catch (err) {
            console.error("Failed to copy to clipboard:", err);
        }
    }

    function clearScores() {
        if (!isModerator) return;
        modalStore.show({
            title: "Clear Scores",
            message: "Are you sure you want to clear scores?",
            cancelCallback: () => {
                modalStore.hide();
            },
            confirmCallback: () => {
                const gId = gameIdStore.value;
                if (gId) {
                    // Clear scores via Convex
                    convex.mutation(api.games.clearScores, { gameId: gId });

                    // Add chat message via socket
                    socket.emit("addChatMessage", {
                        type: "notification",
                        text: "Scores cleared",
                    });
                }

                modalStore.hide();
            },
        });
    }
</script>

<div class="expanded-scoreboard">
    <ScoreboardTable scoreboardData={scoreboardStore.value} {isModerator} />
    <div class="actions">
        <button onclick={exportScores}>Export Scores</button>
        <button onclick={copyAsASCII}>{copyButtonText}</button>
        {#if isModerator}
            <button onclick={clearScores}>Clear Scores</button>
        {/if}
    </div>
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    .expanded-scoreboard {
        overflow: auto;
        background: $background-1;
        border-radius: 1em;
        padding: 2em;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border: 3px solid $border-color;
        position: relative;
    }

    .actions {
        margin-top: 1em;
        display: flex;
        gap: 0.5em;
    }

    button {
        @extend %button;

        font-size: 1rem;
        padding: 0.5em 1em;
    }
</style>
