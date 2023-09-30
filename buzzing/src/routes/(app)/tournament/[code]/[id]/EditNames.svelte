<script lang="ts">
    export let teamPlayers: Record<string, {
        teamName: string,
        players: Record<string, string>
    }>
    export let confirmCallback: (teamNames: Record<string, string>, playerNames: Record<string, string>) => void
    export let cancelCallback: () => void

    let teamNames: Record<string, string> = Object.fromEntries(
        Object.entries(teamPlayers).map(([teamId, { teamName }]) => [teamId, teamName])
    )
    let playerNames: Record<string, string> = Object.fromEntries(
        Object.values(teamPlayers).map(({ players }) => Object.entries(players)).flat()
    )

    function confirm() {
        confirmCallback(teamNames, playerNames)
    }
</script>

<div class="modal">
    <h2>Edit Names</h2>
    <ul>
        {#each Object.entries(teamPlayers) as [teamId, team]}
            <li>
                <input type="text" name="team-{teamId}" bind:value={teamNames[teamId]} />
                <ul>
                    {#each Object.keys(team.players) as playerId}
                        <li>
                            <input type="text" name="player-{playerId}" bind:value={playerNames[playerId]} />
                        </li>
                    {/each}
                </ul>
            </li>
        {/each}
    </ul>

    <button on:click={confirm}>Save Changes</button>
    <button on:click={cancelCallback}>Cancel</button>
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    .modal {
        background: $background-2;
        border-radius: 15px;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 2em;
    }

    button {
        @extend %button;
        
        font-size: 20px;
        padding: 0.6em;
        border-radius: 0.6em;
    }
</style>