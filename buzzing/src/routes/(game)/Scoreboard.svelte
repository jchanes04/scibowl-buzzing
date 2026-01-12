<script lang="ts">
    import { useQuery } from "convex-svelte";
    import gameStore from "$lib/stores/game"
    import type { QuestionPairScore, Scores } from "$lib/classes/GameScoreboard";
    import type { ClientPlayerData } from "$lib/classes/client/ClientPlayer";
    import type { ClientTeamData } from "$lib/classes/client/ClientTeam";
    import { page } from "$app/state";
    import { api } from "../../../convex/_generated/api";


    const rawTeams = useQuery(api.teams.getByGameId, { gameId : page.params.id ?? "" });
    const teams : ClientTeamData[] = $derived(
        (rawTeams.data ?? []).map(team => ({
            id: team.externalId,
            name: team.name,
            type: team.type
        }))
    );

    const rawPlayers = useQuery(api.players.getByGameId, { gameId : page.params.id ?? "" });
    const players : ClientPlayerData[] = $derived(
        (rawPlayers.data ?? []).map(player => ({
            name: player.name,
            id: player.externalId,
            connected: player.connected,
            type: "player",
            team: teams.find(team => team.id === player.teamId)?.id ?? null,
            isCaptain: player.isCaptain ?? false
        }))
    );

    const rawGame = useQuery(api.games.getGameById, { gameId : page.params.id ?? "" as any});
    const gameScores : Scores = $derived(JSON.parse(rawGame.data?.scoreboard ?? "{}"));

    const pointValues = {
        tossup: 4,
        bonus: 10,
        penalty: -4
    }

    function sumQuestionScores(scores: Scores, teamId: string) {
        return Object.values(scores).reduce((acc, q) => {
            if (q.tossup[teamId]?.scoreType === "correct") {
                acc += pointValues.tossup 
            } else if (q.tossup[teamId]?.scoreType === "penalty") {
                acc += pointValues.penalty
            }

            if (q.bonus?.teamId === teamId && q.bonus?.correct) {
                acc += pointValues.bonus
            }
            return acc
        }, 0)
    }
</script>

<div class="scoreboard">
    <h2>Scoreboard</h2>
    <ul>
        {#key players}
            {#each teams as team}
                <li class:buzzed={$gameStore.state.buzzedTeamIds.includes(team.id)}>
                    <h1>
                        <span class="team-name">{team.name}</span>
                        <span class="team-score">{sumQuestionScores(gameScores, team.id)}</span>
                    </h1>
                    {#if team.type !== "individual"}
                        <ul>
                            {#each players.filter(p => p.team === team.id) as player}
                                <li class="player-row" class:captain={player.isCaptain}>
                                    {player.name}
                                </li>   
                            {/each}
                        </ul>
                    {/if}
                </li>
            {/each}
        {/key}
    </ul>
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    .scoreboard {
        @include vertical-scrollable();

        height: 100%;
        min-height: 10em;
        max-height: 25em;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        grid-area: scoreboard;
        padding: 1.5em;
        box-sizing: border-box;
        border-radius: 1em;
        background: $background-1;
        box-shadow: $shadow;
        border: 3px solid $border-color;
    }

    h1 {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 0;
        
        .team-name {
            font-size: 1.1rem;
            font-weight: 700;
            color: $text;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .team-score {
            font-size: 1.5rem;
            font-weight: 800;
            color: $primary;
            font-variant-numeric: tabular-nums;
        }
    }

    h2 {
        font-size: 1.5rem;
        font-weight: 800;
        margin-top: 0;
        margin-bottom: 1.25rem;
        color: $primary;
        border-bottom: 2px solid $gray-2;
        padding-bottom: 0.5rem;
    }

    ul {
        list-style: none;
        padding-left: 0px;
        display: flex;
        flex-direction: column;
        gap: 0.75em;
    }

    li {
        padding: 1.25em;
        border-radius: 1rem;
        background: $background-1;
        border: 1px solid $border-color;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        position: relative;
        overflow: hidden;
        
        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: transparent;
            transition: background 0.2s;
        }

        &.buzzed {
            border-color: $orange;
            transform: #{"scale(1.02)"};
            box-shadow: 0 10px 15px -3px rgba($orange, 0.1), 0 4px 6px -2px rgba($orange, 0.05);
            
            &::before {
                background: $orange;
            }
            
            .team-score {
                color: $orange-dark;
            }
        }
    }

    li ul {
        padding-left: 0.5em;
        margin-top: 0.25em;
        display: flex;
        flex-direction: column;
        gap: 0.25em;
    }
    
    .player-row {
        font-size: 0.95rem;
        color: $gray-2;
        display: flex;
        gap: 0.5em;
        padding: .5em;
        border-radius: .5rem;
        border: 0px solid $border-color;
        background: $background-1;
        
        &.captain {
            font-weight: 600;
            color: $primary;
        }
    }
</style>