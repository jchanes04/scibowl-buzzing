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

    let memberName = ''
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

<svelte:head>
    <title>Join {gameName}</title>
</svelte:head>

<div>
    <form action={`/join`} method="POST" on:submit={handleSubmit} autocomplete="off">
        <h1>Join {gameName}</h1>
        <div>
            <input type="hidden" name="gameID" value={gameID} />
            <input type="text" placeholder="Your Name" name="name" id="name-input" bind:value={memberName} />
            <br />
            {#if teamFormat === "any"}
                <div class="radio-wrapper">
                    <label for="indiv">
                        <input id="indiv" type="radio" name="team-or-indiv" value="indiv" bind:group={teamOrIndiv} />
                        <span />
                        Play on my own
                    </label>
                    <br />
                    <label for="new-team">
                        <input id="new-team" type="radio" name="team-or-indiv" value="new-team" bind:group={teamOrIndiv} />
                        <span />
                        Create a new team:
                    </label>
                </div>
                <div style={`display: ${teamOrIndiv === "new-team" ? "default" : "none"}`}>
                    <input type="text" placeholder="Team Name" name="new-team-name" bind:value={newTeamName} />
                </div>
                {#if teams.length > 0}
                    <br />
                    <div class="radio-wrapper">
                            <label for="team">
                                <input id="team" type="radio" name="team-or-indiv" value="team" bind:group={teamOrIndiv} />
                                <span />
                                Play with an existing team:
                            </label>
                    </div>
                {/if}
                <div style={`display: ${teamOrIndiv === "team" ? "default" : "none"}`}>
                    <select name="team-id" bind:value={teamID}>
                        <option value="" hidden default></option>
                        {#each teams as team}
                            <option value={team.id}>{team.name}</option>
                        {/each}
                    </select>
                </div>
                <br />
            {:else if teamFormat === "teams"}
                <label for="team-id">Team: </label>
                <select id="team-id" name="team-id" bind:value={teamID}>
                    <option value="" hidden default></option>
                    {#each teams as team}
                        <option value={team.id}>{team.name}</option>
                    {/each}
                </select>
                <br />
            {/if}
            <br />
            <button id="join-game" disabled={disabled}>Join</button>
        </div>
        <JoinMemberList memberNames={memberNames} />
    </form>
</div>

<style lang="scss">
    form {
        margin: 3em auto;
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
            display: inline-block;
            position: relative;
            background: #FFF;
            vertical-align: text-top;
            margin-right: 0.3em;

            &::after {
                content: '';
                position: absolute;
                display: none;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
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