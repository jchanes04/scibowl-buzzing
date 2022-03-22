<script lang="ts" context="module">
    import type { LoadInput } from "@sveltejs/kit";

    export async function load({ params, fetch }: LoadInput) {

        const res = await fetch(`/api/join/${params.id}`)

        if (res.ok) {
            const json = await res.json()
            return {
                props: {
                    ...json,
                    gameId: params.id
                }
            }
        }

        return {}
    }
</script>

<script lang="ts">
    export let memberNames: string[], gameName: string, gameId: string, teamSettings: TeamSettings, teams: TeamData[]

    import { session } from "$app/stores"
    
    import JoinMemberList from '$lib/components/JoinMemberList.svelte'
    import type { TeamData } from "$lib/classes/Team";
    import type { TeamSettings } from "$lib/classes/Game";

    let memberName = ''
    let teamOrIndiv: "indiv" | "team" | "new-team" | "" = ""
    let teamID: string
    let newTeamName: string
    let showRadio: boolean = true
    if (teamSettings.individualsAllowed && teams.length == 0) teamOrIndiv = "indiv"
    if (teamSettings.newTeamsAllowed && teams.length == 0) teamOrIndiv = "new-team"
    if (!(teamSettings.individualsAllowed || teamSettings.newTeamsAllowed)) teamOrIndiv = "team"

    if (teamOrIndiv != "") showRadio = false
    $: disabled = 
        memberName === '' || !teamOrIndiv
        
</script>

<svelte:head>
    <title>Join {gameName}</title>
</svelte:head>

<div>
    <form action="/api/join" method="POST" autocomplete="off">
        <h1>Join {gameName}</h1>
        <div>
            <input type="hidden" name="gameId" value={gameId} />
            <input type="text" placeholder="Your Name" name="name" id="name-input" bind:value={memberName} />
            <br />
            {#if !showRadio}
                <input type="hidden" name="team-or-indiv" value={teamOrIndiv} />
            {/if}
            {#if teamSettings.individualsAllowed && showRadio}
                <div class="radio-wrapper">
                    <label for="indiv">
                        <input id="indiv" type="radio" name="team-or-indiv" value="indiv" bind:group={teamOrIndiv} />
                        <span />
                        Play on my own
                    </label>
                </div>
                <br />
            {/if}
            {#if teamSettings.newTeamsAllowed}
                {#if showRadio}
                    <div class="radio-wrapper">
                        <label for="new-team">
                            <input id="new-team" type="radio" name="team-or-indiv" value="new-team" bind:group={teamOrIndiv} />
                            <span />
                            Create a new team:
                        </label>
                    </div>
                {/if}
                <div style={`display: ${teamOrIndiv === "new-team" ? "default" : "none"}`}>
                    <input type="text" placeholder="Team Name" name="new-team-name" bind:value={newTeamName} />
                </div>
                <br />
            {/if} 
            {#if teams.length > 0}
                {#if showRadio}
                    <div class="radio-wrapper">
                        <label for="team">
                            <input id="team" type="radio" name="team-or-indiv" value="team" bind:group={teamOrIndiv} />
                            <span />
                                Play with an existing team:                        
                        </label>
                    </div>
                {:else}
                    <label for="team-select">Team:</label>
                {/if}

                <div style={`display: ${teamOrIndiv === "team" ? "default" : "none"}`}>
                    <select id="team-select" name="team-id" bind:value={teamID}>
                        <option value="" hidden default></option>
                        {#each teams as team}
                            <option value={team.id}>{team.name}</option>
                        {/each}
                    </select>
                </div>
                <br />
                <br />
            {/if}
            <button id="join-game" disabled={disabled}>Join</button>
        </div>
        <JoinMemberList memberNames={memberNames} />
    </form>
</div>

<style lang="scss">
    form {
        margin: 0em auto;
        border-radius: 1em;
        text-align: center;
        padding: 1em;
        position: relative;
    }

    h1 {
        font-size: 44px;
        text-decoration: underline var(--blue) 3px;
        text-underline-offset: 0.2em;
    }

    .radio-wrapper {
        text-align: left;
        display: inline-block;
    }

    input[type="text"] {
        padding: 0.3em;
        font-size: 24px;
        margin: 0.5em auto;
        border: none;
        border-radius: 0.3em;
        box-sizing: border-box;
        width: 25ch;
        max-width: 80vw;
        text-align: center;
        font-family: 'Ubuntu';
        position: relative;

        &:focus::placeholder {
            color: transparent;
        }
    }

    label {
        cursor: pointer;
        padding-top: 0.3em;
        padding-bottom: 0.3em;
        display: inline-block;
        font-size: 20px;

        input {
            visibility: hidden;
            width: 0;
            height: 0;
        }

        span {
            width: 1em;
            height: 1em;
            border-radius: 50%;
            border: #CCC 2px solid;
            display: inline-grid;
            place-content: center;
            background: #FFF;
            vertical-align: text-top;
            margin-right: 0.3em;

            &::after {
                content: '';
                display: none;
                width: 0.7em;
                height: 0.7em;
                border-radius: 0.35em;
                background: var(--blue);
            }
        }

        &:hover > span {
            border-color: var(--green);
        }

        input:checked ~ span::after {
            display: inline-block;
        }
    }

    select {
        font-size: 20px;
        margin-left: 0.5em;
    }

    button {
        padding: 0.5em;
        color: #EEE;
        background: var(--green);
        border-radius: 0.3em;
        font-weight: bold;
        border: solid black 3px;
        font-size: 18px;
        cursor: pointer;
        width: 8ch;

        &:disabled {
            border: solid var(--green) 3px;
            background: transparent;
            color: #444;
            cursor: default;
        }
    }
</style>