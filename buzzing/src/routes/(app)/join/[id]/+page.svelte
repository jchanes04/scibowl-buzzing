<script lang="ts">
    import JoinMemberList from '$lib/components/JoinMemberList.svelte'
    import Select from "svelte-select";
    import type { PageData } from './$types'
    import type { TeamData } from "$lib/classes/Team";

    export let data: PageData
    let { memberNames, gameName, settings, teams } = data
    $: ({ memberNames, gameName, settings, teams } = data)

    let memberName = ''
    let teamOrIndiv: "indiv" | "team" | "new-team" | null = null
    let selectedTeam: TeamData
    let newTeamName: string
    let showRadio: boolean = true
    if (settings.individualsAllowed && teams.length == 0) teamOrIndiv = "indiv"
    if (settings.newTeamsAllowed && teams.length == 0) teamOrIndiv = "new-team"
    if (!(settings.individualsAllowed || settings.newTeamsAllowed)) teamOrIndiv = "team"

    if (teamOrIndiv !== null) showRadio = false
    $: disabled = !memberName || !teamOrIndiv || (teamOrIndiv === "new-team" && !newTeamName) || (teamOrIndiv === "team" && !selectedTeam)
        
    function handleTeamNameInput() {
        if (newTeamName.length > 30) {
            newTeamName = newTeamName.slice(0, 30)
        }
    }
</script>

<svelte:head>
    <title>Join {gameName}</title>
</svelte:head>

<div>
    <form method="POST" autocomplete="off">
        <h1>Join {gameName}</h1>
        <div>
            <input type="text" placeholder="Your Name" name="name" id="name-input" bind:value={memberName} />
            <br />
            {#if !showRadio}
                <input type="hidden" name="team-or-indiv" value={teamOrIndiv} />
            {/if}
            {#if settings.individualsAllowed && showRadio}
                <div class="radio-wrapper">
                    <label for="indiv">
                        <input id="indiv" type="radio" name="team-or-indiv" value="indiv" bind:group={teamOrIndiv} />
                        <span />
                        Play on my own
                    </label>
                </div>
                <br />
            {/if}
            {#if settings.newTeamsAllowed}
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
                    <input type="text" placeholder="Team Name" name="new-team-name" bind:value={newTeamName} on:input={handleTeamNameInput} />
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

                <div class="select-wrapper" style={`display: ${teamOrIndiv === "team" ? "default" : "none"}`}>
                    <Select itemId="id" label="name" items={teams} bind:value={selectedTeam} placeholder="Team" searchable={false} showChevron={true} />
                    <input type="hidden" name="team-id" value={selectedTeam?.id}>
                </div>
                <br />
                <br />
            {/if}
            <button id="join-game" {disabled}>Join</button>
        </div>
        <JoinMemberList memberNames={memberNames} />
    </form>
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    form {
        margin: 0em auto;
        border-radius: 1em;
        text-align: center;
        padding: 1em;
        position: relative;
    }

    h1 {
        font-size: 44px;
        text-decoration: underline $blue 3px;
        text-underline-offset: 0.2em;
    }

    .radio-wrapper {
        text-align: left;
        display: inline-block;
    }

    input[type="text"] {
        @extend %text-input;

        font-size: 24px;
        margin: 0.5em auto;
        width: 25ch;
        max-width: 80vw;
        text-align: center;
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
                background: $blue;
            }
        }

        &:hover > span {
            border-color: $green;
        }

        input:checked ~ span::after {
            display: inline-block;
        }
    }

    .select-wrapper {
        width: max-content;
        min-width: 25ch;
        margin: auto;
        font-size: 20px;
        text-align: center;
    }

    button {
        @extend %button;

        font-size: 18px;
        width: 8ch;
    }
</style>