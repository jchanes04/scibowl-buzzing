<script lang="ts">
    import { run } from "svelte/legacy";

    import JoinMemberList from "$lib/components/JoinMemberList.svelte";
    import Select from "svelte-select";
    import { slide } from "svelte/transition";
    import type { PageData } from "./$types";
    import type { TeamData } from "$lib/classes/Team";

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
    let memberNames = $derived(data.memberNames);
    let gameName = $derived(data.gameName);
    let settings = $derived(data.settings);
    let teams = $derived(data.teams);

    let memberName = $state("");
    let teamOrIndiv: "indiv" | "team" | "new-team" | null = $state(null);
    let selectedTeam: TeamData | undefined = $state();
    let newTeamName: string = $state("");
    let showRadio: boolean = $state(true);

    $effect.pre(() => {
        if (settings.individualsAllowed && teams.length == 0)
            teamOrIndiv = "indiv";
        if (settings.newTeamsAllowed && teams.length == 0)
            teamOrIndiv = "new-team";
        if (!(settings.individualsAllowed || settings.newTeamsAllowed))
            teamOrIndiv = "team";

        if (teamOrIndiv !== null) showRadio = false;
    });
    let disabled = $derived(
        !memberName ||
            !teamOrIndiv ||
            (teamOrIndiv === "new-team" && !newTeamName) ||
            (teamOrIndiv === "team" && !selectedTeam),
    );

    function handleTeamNameInput() {
        if (newTeamName.length > 30) {
            newTeamName = newTeamName.slice(0, 30);
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
            <input
                type="text"
                placeholder="Your Name"
                name="name"
                id="name-input"
                bind:value={memberName}
            />
            <h2>Team:</h2>
            {#if !showRadio}
                <input type="hidden" name="team-or-indiv" value={teamOrIndiv} />
            {/if}
            {#if settings.individualsAllowed && showRadio}
                <div class="radio-wrapper">
                    <label for="indiv">
                        <input
                            id="indiv"
                            type="radio"
                            name="team-or-indiv"
                            value="indiv"
                            bind:group={teamOrIndiv}
                        />
                        <span></span>
                        Play on my own
                    </label>
                </div>
            {/if}
            {#if settings.newTeamsAllowed}
                {#if showRadio}
                    <div class="radio-wrapper">
                        <label for="new-team">
                            <input
                                id="new-team"
                                type="radio"
                                name="team-or-indiv"
                                value="new-team"
                                bind:group={teamOrIndiv}
                            />
                            <span></span>
                            Create a new team:
                        </label>
                    </div>
                {/if}
                {#if teamOrIndiv === "new-team"}
                    <div transition:slide={{ duration: 200 }}>
                        <input
                            type="text"
                            placeholder="Team Name"
                            name="new-team-name"
                            bind:value={newTeamName}
                            oninput={handleTeamNameInput}
                        />
                    </div>
                {/if}
            {/if}
            {#if teams.length > 0}
                {#if showRadio}
                    <div class="radio-wrapper">
                        <label for="team">
                            <input
                                id="team"
                                type="radio"
                                name="team-or-indiv"
                                value="team"
                                bind:group={teamOrIndiv}
                            />
                            <span></span>
                            Play with an existing team:
                        </label>
                    </div>
                {/if}

                {#if teamOrIndiv === "team"}
                    <div
                        class="select-wrapper"
                        transition:slide={{ duration: 200 }}
                        style="align: center;"
                    >
                        <Select
                            itemId="id"
                            label="name"
                            items={teams}
                            bind:value={selectedTeam}
                            placeholder="Team"
                            searchable={false}
                            showChevron={true}
                        />
                        <input
                            type="hidden"
                            name="team-id"
                            value={selectedTeam?.id}
                        />
                    </div>
                {/if}
            {/if}
            <button id="join-game" {disabled}>Join</button>
        </div>
        <JoinMemberList {memberNames} />
    </form>
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    form {
        margin: 2rem auto;
        max-width: 500px;
        border-radius: 1.5rem;
        text-align: center;
        padding: 3rem;
        background: $background-1;
        box-shadow: $shadow;
        border: 1px solid $border-color;
    }

    h1 {
        font-size: 2.5rem;
        font-weight: 800;
        margin-bottom: 2rem;
        color: $text-dark;
        text-decoration: underline var(--primary) 3px;
        text-underline-offset: 0.2em;
    }

    h2 {
        font-size: 1.25rem;
        font-weight: 700;
        margin-top: 1.5rem;
        margin-bottom: 1rem;
        color: $primary;
        text-align: left;
    }

    .radio-wrapper {
        text-align: left;
        display: block;
        margin-top: 0.5rem;
    }

    input[type="text"] {
        @extend %text-input;
        font-size: 1.1rem;
        width: calc(90% - 1.75rem);
        text-align: left;
        margin-bottom: 0rem;
    }

    label {
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 1.1rem;
        font-weight: 500;
        padding: 0.75rem 1rem;
        border-radius: 0.75rem;
        transition: all 0.2s;
        border: 1px solid transparent;

        input {
            position: absolute;
            opacity: 0;
            width: 0;
            height: 0;
        }

        span {
            width: 1.25rem;
            height: 1.25rem;
            border-radius: 50%;
            border: $gray-2 2px solid;
            display: grid;
            place-content: center;
            background: $background-1;
            transition: all 0.2s;

            &::after {
                content: "";
                display: block;
                width: 0.6rem;
                height: 0.6rem;
                border-radius: 50%;
                background: $primary;
                transform: #{"scale(0)"};
                transition: transform 0.2s;
            }
        }

        input:checked ~ span {
            border-color: $primary;
            &::after {
                transform: #{"scale(1)"};
            }
        }
    }

    .select-wrapper {
        @extend %select-wrapper;
        width: 90%;
        margin: 0.5rem auto 1.5rem auto;
    }

    button#join-game {
        @extend %button;
        font-size: 1.25rem;
        width: 90%;
        padding: 0.8rem;
        margin-top: 1rem;
        background: $primary;
    }
</style>
