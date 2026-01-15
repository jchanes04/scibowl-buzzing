<script lang="ts">
    import { scoreboardStore } from "$lib/stores/scoreboard.svelte";
    import { getContext } from "svelte";
    import { convertToCSV } from "$lib/functions/scoreboard";
    import Confirm from "$lib/components/Confirm.svelte";
    import type { Writable } from "svelte/store";
    import { useConvexClient } from "convex-svelte";
    import { api } from "../../../convex/_generated/api";
    import gameIdStore from "$lib/stores/gameId.svelte";
    import ScoreboardTable from "./ScoreboardTable.svelte";

    interface Props {
        isModerator?: boolean;
    }

    let { isModerator = false }: Props = $props();

    const convex = useConvexClient();

    type ModalStore = Writable<{
        component: any;
        props: Record<string, unknown>;
    } | null>;
    const modalStore: ModalStore = getContext("modalStore");

    async function exportScores() {
        // Need to compute players for CSV export
        const scoreboardData = scoreboardStore.value;
        if (!scoreboardData) return;

        let playersFromScores = Object.values(scoreboardData.scores).reduce(
            (acc: Record<string, string[]>, s: any) => {
                for (const t of Object.keys(s.tossup)) {
                    if (!acc[t]) {
                        acc[t] = [s.tossup[t]!.playerId];
                    } else if (!acc[t]!.includes(s.tossup[t]!.playerId)) {
                        acc[t]!.push(s.tossup[t]!.playerId);
                    }
                }
                return acc;
            },
            {} as Record<string, string[]>,
        );

        let playersFromTeams = (() => {
            const result: Record<string, string[]> = {};
            const { playerNames, teamNames } = scoreboardData;
            // Only use teams that exist in teamNames
            for (const [playerId, playerInfo] of Object.entries(playerNames || {})) {
                if (playerInfo && playerInfo.teamId && teamNames[playerInfo.teamId]) {
                    if (!result[playerInfo.teamId]) result[playerInfo.teamId] = [];
                    if (!result[playerInfo.teamId]?.includes(playerId)) {
                        result[playerInfo.teamId]?.push(playerId);
                    }
                }
            }
            return result;
        })();

        function combinePlayersLists(
            list1: Record<string, string[]>,
            list2: Record<string, string[]>,
        ) {
            const list: Record<string, string[]> = {};
            const keys = new Set([...Object.keys(list1), ...Object.keys(list2)]);
            for (const teamId of keys) {
                list[teamId] = [
                    ...(list1[teamId] || []),
                    ...(list2[teamId] || []).filter(
                        (x) => !(list1[teamId] || []).includes(x),
                    ),
                ];
            }
            return list;
        }

        const players = combinePlayersLists(playersFromScores, playersFromTeams);

        const csv = await convertToCSV(
            scoreboardData.teamNames,
            scoreboardData.playerNames,
            players,
            scoreboardData?.scores || {},
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

    function clearScores() {
        if (!isModerator) return;
        $modalStore = {
            component: Confirm,
            props: {
                title: "Clear Scores",
                message: "Are you sure you want to clear scores?",
                cancelCallback: () => {
                    $modalStore = null;
                },
                confirmCallback: () => {
                    const gId = gameIdStore.value;
                    if (gId) {
                        // Clear scores via Convex
                        convex.mutation(api.games.clearScores, { gameId: gId });

                        // Add chat message via Convex
                        convex.mutation(api.chatMessages.add, {
                            gameId: gId,
                            type: "notification",
                            text: "Scores cleared",
                        });
                    }

                    $modalStore = null;
                },
            },
        };
    }
</script>

<div class="expanded-scoreboard">
    <ScoreboardTable
        scoreboardData={scoreboardStore.value}
        {isModerator}
    />
    <div class="actions">
        <button onclick={exportScores}>Export Scores</button>
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

