<script lang="ts" context="module">
    import type { LoadInput } from "@sveltejs/kit";


    export async function load({ page, fetch }: LoadInput) {

        let res = await fetch(`/api/join/${page.params.id}`)

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
    export let memberNames: string[], gameName: string, gameID: string, teamFormat: TeamFormat, teams: TeamClean[]

    import { session } from "$app/stores"
    
    import JoinMemberList from '$lib/components/JoinMemberList.svelte'
    import type { TeamFormat } from "$lib/classes/Game";
    import type { TeamClean } from "$lib/classes/Team";

    let memberName
    let teamOrIndiv
    let teamID
    let newTeamName

    function handleSubmit() {
        $session.memberName = memberName
    }

    $: disabled = 
        memberName === '' || 
        (teamFormat === "any" &&
            !teamOrIndiv || 
            (teamOrIndiv === "team" && !teamID) ||
            (teamOrIndiv === "new-team" && !newTeamName)
        ) ||
        (teamFormat === "teams" && !teamID)
</script>

<div>
    <form action={`/join`} method="POST" on:submit={handleSubmit} autocomplete="off">
        <h3>Join {gameName}</h3>
        <div>
            <input type="hidden" name="gameID" value={gameID} />
            <input type="text" placeholder="Your Name" name="name" id="name-input" bind:value={memberName} />
            <br />
            {#if teamFormat === "any"}
                <input id="indiv" type="radio" name="team-or-indiv" value="indiv" bind:group={teamOrIndiv} />
                <label for="indiv">Play on my own</label>
                <input id="new-team" type="radio" name="team-or-indiv" value="new-team" bind:group={teamOrIndiv} />
                <label for="new-team">
                    Create a new team: 
                    <input type="text" name="new-team-name" bind:value={newTeamName} />
                </label>
                {#if teams.length > 0}
                    <input id="team" type="radio" name="team-or-indiv" value="team" bind:group={teamOrIndiv} />
                    <label for="team">
                        Play with an existing team:
                        <br />
                        <select name="team-id" bind:value={teamID}>
                            {#each teams as team}
                                <option value={team.id}>{team.name}</option>
                            {/each}
                        </select>
                    </label>
                {/if}
            {:else if teamFormat === "teams"}
                <label for="team-id">Team: </label>
                <select id="team-id" name="team-id" bind:value={teamID}>
                    {#each teams as team}
                        <option value={team.id}>{team.name}</option>
                    {/each}
                </select>
            {/if}
            <br />
            <button id="join-game" disabled={disabled}>Join</button>
        </div>
        <JoinMemberList memberNames={memberNames} />
    </form>
</div>

