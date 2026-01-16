<script lang="ts">
    interface Props {
        teams?: string[];
        newTeamName: string;
    }

    let { teams = $bindable([]), newTeamName = $bindable() }: Props = $props();
    let teamsJSON = $derived(JSON.stringify(teams));

    function addTeam() {
        if (newTeamName && !teams.includes(newTeamName)) {
            teams = [...teams, newTeamName];
            newTeamName = "";
        }
    }

    function removeTeam(teamToRemove: string) {
        teams = teams.filter((t) => t !== teamToRemove);
    }

    function handleInputKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            addTeam();
        }
    }

    function handleInput() {
        if (newTeamName.length > 30) {
            newTeamName = newTeamName.slice(0, 30);
        }
    }
</script>

<div class="team-list">
    <input type="hidden" name="teams" value={teamsJSON} />

    {#each teams as team}
        <div class="team-card">
            <span class="team-name">{team}</span>
            <button
                type="button"
                class="icon-btn remove"
                onclick={() => removeTeam(team)}
                aria-label="Remove team"
            ></button>
        </div>
    {/each}

    <div class="team-card input-card">
        <input
            type="text"
            placeholder="Add Team..."
            bind:value={newTeamName}
            onkeydown={handleInputKeydown}
            oninput={handleInput}
        />
        <button
            type="button"
            class="icon-btn add"
            onclick={addTeam}
            aria-label="Add team"
        ></button>
    </div>
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    .team-list {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.5rem;
        width: 90%;
        max-width: 100%;
        margin: 1rem auto 0;
    }

    .team-card {
        background: $background-1;
        border: 3px solid $border-color;
        border-radius: 1rem;
        padding: 0.75rem 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.2s;

        .team-name {
            font-size: 1.1rem;
            font-weight: 700;
            color: $text;
            word-break: break-word;
        }

        &.input-card {
            &:focus-within {
                border-color: $primary;
            }
        }
    }

    input[type="text"] {
        @extend %text-input;
        margin: 0;
        border: none;
        box-shadow: none;
        background: transparent;
        padding: 0 0.25rem;
        font-size: 1.1rem;
        width: 100%;
        text-align: left;
        line-height: 1.5;

        &:focus {
            outline: none;
            border: none;
            box-shadow: none;
        }
    }

    .icon-btn {
        width: 1.5rem;
        height: 1.5rem;
        border: none;
        cursor: pointer;
        display: block;
        transition:
            transform 0.1s,
            opacity 0.2s;
        flex-shrink: 0;
        margin-left: 0.75rem;
        padding: 0;
        -webkit-appearance: none;
        appearance: none;

        &:hover {
            opacity: 0.8;
            transform: #{"scale(1.1)"};
        }
        &:active {
            transform: #{"scale(0.95)"};
        }

        &.add {
            background: $primary;
            clip-path: polygon(
                0 40%,
                40% 40%,
                40% 0,
                60% 0,
                60% 40%,
                100% 40%,
                100% 60%,
                60% 60%,
                60% 100%,
                40% 100%,
                40% 60%,
                0 60%
            );
        }

        &.remove {
            background: $red;
            clip-path: polygon(
                20% 0%,
                0% 20%,
                30% 50%,
                0% 80%,
                20% 100%,
                50% 70%,
                80% 100%,
                100% 80%,
                70% 50%,
                100% 20%,
                80% 0%,
                50% 30%
            );
        }
    }
</style>
