<script lang="ts">
    interface Props {
        teams?: string[];
        newTeamName: string;
    }

    let { teams = $bindable([]), newTeamName = $bindable() }: Props = $props();
    let teamsJSON = $derived(JSON.stringify(teams))

    function addTeam() {
        if (newTeamName && !teams.includes(newTeamName)) {
            teams = [...teams, newTeamName]
        }
        newTeamName = ''
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.code === "Enter" || e.keyCode === 13) {
            addTeam()
        }
    }

    function handleInput() {
        if (newTeamName.length > 30) {
            newTeamName = newTeamName.slice(0, 30)
        }
    }
</script>

<div>
    <input type="hidden" name="teams" value={teamsJSON} />
    <ul>
        {#each teams as team}
            <li>
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <span onclick={() => {teams = teams.filter(x => x !== team)}}>
                    <span class="remove"></span>
                </span>
                {team}
            </li>
        {/each}
        <li>
            <input type="text" id="default-team-name" bind:value={newTeamName} oninput={handleInput} />
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <span onclick={addTeam}>
                <span class="add"></span>
            </span>
        </li>
    </ul>
</div>

<svelte:body onkeydown={handleKeydown}></svelte:body>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    ul {
        list-style: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0;
    }

    li {
        margin-top: 0.3em;
        margin-bottom: 0.3em;
    }

    li > span {
        width: 1em;
        height: 1em;
        display: inline-block;
        cursor: pointer;
        vertical-align: middle;

        span {
            width: 100%;
            height: 100%;
            display: inline-block;
        }
    }

    .add {
        background: $primary;
        clip-path: polygon(0 40%, 40% 40%, 40% 0, 60% 0, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0 60%);
        margin-left: 0.2em;
        float: right;
    }

    .remove {
        background: $red;
        clip-path: polygon(15% 0, 0 15%, 35% 50%, 0 85%, 15% 100%, 50% 65%, 85% 100%, 100% 85%, 65% 50%, 100% 15%, 85% 0, 50% 35%);
        margin-right: 0.5em;
    }

    input[type="text"] {
        @extend %text-input;

        font-size: 16px;
        margin: 0.5em auto;
        width: 25ch;
        text-align: center;
    }
</style>