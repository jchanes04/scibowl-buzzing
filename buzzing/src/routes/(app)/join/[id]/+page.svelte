<script lang="ts">
    import { slide } from "svelte/transition";
    import type { PageData } from "./$types";
    import { user } from "$lib/stores/auth";
    import { useQuery } from "convex-svelte";
    import { api } from "../../../../../convex/_generated/api";

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
    let gameId = $derived(data.gameId);
    let gameName = $derived(data.gameName);
    let settings = $derived(data.settings);
    let isTournamentGame = $derived(data.isTournamentGame);
    let tournamentData = $derived(data.tournamentData);
    let isModerator = $derived(data.isModerator);

    // Initial data from server (used as fallback before Convex loads)
    let initialMemberNames = $derived(data.memberNames);
    let initialTeams = $derived(data.teams);

    // Convex real-time queries for members and teams
    let membersQuery = useQuery(api.gameMembers.getForGame, () =>
        gameId ? { gameId } : "skip",
    );
    let teamsQuery = useQuery(api.teams.getForGame, () =>
        gameId ? { gameId } : "skip",
    );

    // Derive member names from Convex query, falling back to initial server data
    let memberNames = $derived.by(() => {
        if (membersQuery.data) {
            return membersQuery.data
                .filter((m) => m.isActive)
                .map((m) => m.name);
        }
        return initialMemberNames;
    });

    // Type for team selection (matches CachedTeam shape)
    type SelectableTeam = {
        id: string;
        name: string;
        type: "default" | "created" | "individual" | "tournament";
        captainId?: string;
    };

    // Derive teams from Convex query, falling back to initial server data
    // Filter out individual teams and transform teamId -> id for Select component
    let teams: SelectableTeam[] = $derived.by(() => {
        if (teamsQuery.data) {
            return teamsQuery.data
                .filter((t) => t.type !== "individual")
                .map((t) => ({
                    id: t.teamId,
                    name: t.name,
                    type: t.type,
                    captainId: t.captainId,
                }));
        }
        return initialTeams as SelectableTeam[];
    });

    // Combine teams and members for display card
    let teamsWithMembers = $derived.by(() => {
        const currentTeams = teams;
        // Fallback to empty array if data isn't loaded yet
        const currentMembers = membersQuery.data || [];

        return currentTeams.map((team) => {
            const members = currentMembers
                .filter((m) => m.teamId === team.id && m.isActive)
                .sort((a, b) => {
                    // Captain first
                    if (a.id === team.captainId) return -1;
                    if (b.id === team.captainId) return 1;
                    return a.name.localeCompare(b.name);
                });

            return {
                ...team,
                members,
            };
        });
    });

    let memberName = $state("");
    let selectedTeam: SelectableTeam | undefined = $state();
    let newTeamName: string = $state("");

    // Tournament-specific state
    let selectedTournamentPlayer: {
        name: string;
        teamId: string;
        teamName: string;
    } | null = $state(null);

    // Build list of all players from tournament teams for dropdown
    let tournamentPlayerOptions = $derived.by(() => {
        if (!tournamentData?.teams) return [];
        const options: { name: string; teamId: string; teamName: string }[] =
            [];
        for (const team of tournamentData.teams) {
            for (const playerName of team.players) {
                options.push({
                    name: playerName,
                    teamId: team.teamId,
                    teamName: team.name,
                });
            }
        }
        return options;
    });

    // Determine if there is only one option for teamOrIndiv
    function getInitialTeamOrIndiv(): "indiv" | "team" | "new-team" | null {
        if (
            settings.individualsAllowed &&
            teams.length === 0 &&
            !settings.newTeamsAllowed
        ) {
            return "indiv";
        } else if (
            settings.newTeamsAllowed &&
            teams.length === 0 &&
            !settings.individualsAllowed
        ) {
            return "new-team";
        } else if (
            !settings.individualsAllowed &&
            !settings.newTeamsAllowed &&
            teams.length > 0
        ) {
            return "team";
        }
        return null;
    }

    let teamOrIndiv: "indiv" | "team" | "new-team" | null = $state(
        getInitialTeamOrIndiv(),
    );

    // Auto-populate member name from user profile on page load
    let hasAutoPopulated = $state(false);
    $effect(() => {
        if (!hasAutoPopulated) {
            user.subscribe((currentUser) => {
                if (currentUser && !memberName) {
                    // Use username by default, fallback to firstName
                    const displayName =
                        currentUser.username || currentUser.firstName;
                    if (displayName) {
                        memberName = displayName;
                        hasAutoPopulated = true;
                    }
                }
            });
        }
    });

    let disabled = $derived(
        isTournamentGame && !isModerator
            ? !selectedTournamentPlayer // Tournament player needs to select from dropdown
            : isModerator
              ? !memberName // Moderator just needs name
              : !memberName ||
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
            {#if isTournamentGame && !isModerator}
                <!-- Tournament Player Selection -->
                <h2>Select Your Name</h2>
                <p class="tournament-info">
                    This is a tournament game. Select your name from the list
                    below.
                </p>
                {#if tournamentPlayerOptions.length > 0}
                    <select
                        class="tournament-select"
                        onchange={(e) => {
                            const val = (e.target as HTMLSelectElement).value;
                            if (val) {
                                const opt = tournamentPlayerOptions.find(
                                    (p) => `${p.name}|${p.teamId}` === val,
                                );
                                if (opt) selectedTournamentPlayer = opt;
                            } else {
                                selectedTournamentPlayer = null;
                            }
                        }}
                    >
                        <option value="">-- Select your name --</option>
                        {#each tournamentPlayerOptions as player}
                            <option value="{player.name}|{player.teamId}">
                                {player.name} [{player.teamName}]
                            </option>
                        {/each}
                    </select>
                    {#if selectedTournamentPlayer}
                        <input
                            type="hidden"
                            name="name"
                            value={selectedTournamentPlayer.name}
                        />
                        <input
                            type="hidden"
                            name="team-or-indiv"
                            value="team"
                        />
                        <input
                            type="hidden"
                            name="team-id"
                            value={selectedTournamentPlayer.teamId}
                        />
                        <input
                            type="hidden"
                            name="tournament-player"
                            value="true"
                        />
                    {/if}
                {:else}
                    <p class="no-players">
                        No teams have been assigned to this match yet.
                    </p>
                {/if}
            {:else if isModerator}
                <!-- Moderator Join - Just Name -->
                <input
                    type="text"
                    placeholder="Your Name"
                    name="name"
                    id="name-input"
                    bind:value={memberName}
                />
                <input type="hidden" name="moderator" value="true" />
            {:else}
                <!-- Regular Game Join -->
                <input
                    type="text"
                    placeholder="Your Name"
                    name="name"
                    id="name-input"
                    bind:value={memberName}
                />
                <h2>Team:</h2>
            {/if}

            {#if !isTournamentGame && !isModerator}
                <div class="team-list">
                    {#each teamsWithMembers as team (team.id)}
                        <label
                            class="team-card"
                            class:selected={teamOrIndiv === "team" &&
                                selectedTeam?.id === team.id}
                        >
                            <input
                                type="radio"
                                name="team-or-indiv"
                                value="team"
                                onchange={() => {
                                    teamOrIndiv = "team";
                                    selectedTeam = team;
                                }}
                                checked={teamOrIndiv === "team" &&
                                    selectedTeam?.id === team.id}
                            />
                            <div class="card-content">
                                <div class="team-header">
                                    <span class="team-name">{team.name}</span>
                                </div>
                                {#if team.members.length > 0}
                                    <ul class="member-list">
                                        {#each team.members as member}
                                            <li
                                                class:captain={member.id ===
                                                    team.captainId}
                                            >
                                                {member.name}
                                            </li>
                                        {/each}
                                    </ul>
                                {:else}
                                    <p class="empty-team">No members yet</p>
                                {/if}
                            </div>
                        </label>
                    {/each}
                    <input
                        type="hidden"
                        name="team-id"
                        value={selectedTeam?.id}
                    />
                </div>
            {/if}

            {#if !isTournamentGame && !isModerator && (settings.individualsAllowed || settings.newTeamsAllowed)}
                <div class="other-options">
                    {#if settings.individualsAllowed}
                        <label
                            class="team-card"
                            class:selected={teamOrIndiv === "indiv"}
                        >
                            <input
                                type="radio"
                                name="team-or-indiv"
                                value="indiv"
                                bind:group={teamOrIndiv}
                            />
                            <div class="card-content">
                                <span class="team-name">Play on my own</span>
                            </div>
                        </label>
                    {/if}

                    {#if settings.newTeamsAllowed}
                        <label
                            class="team-card"
                            class:selected={teamOrIndiv === "new-team"}
                        >
                            <input
                                type="radio"
                                name="team-or-indiv"
                                value="new-team"
                                bind:group={teamOrIndiv}
                            />
                            <div class="card-content">
                                <span class="team-name">Create a new team</span>
                                {#if teamOrIndiv === "new-team"}
                                    <div transition:slide={{ duration: 200 }}>
                                        <input
                                            type="text"
                                            class="card-input"
                                            placeholder="Team Name"
                                            name="new-team-name"
                                            bind:value={newTeamName}
                                            oninput={handleTeamNameInput}
                                            onclick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                {/if}
                            </div>
                        </label>
                    {/if}
                </div>
            {/if}

            <button id="join-game" {disabled}>Join</button>
        </div>
    </form>
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    form {
        margin: 2rem auto;
        max-width: min(500px, 60%);
        border-radius: 1.5rem;
        text-align: center;
        padding: 3rem;
        background: $background-1;
        box-shadow: $shadow;
        border: 3px solid $border-color;
    }

    h1 {
        font-size: 2.5rem;
        font-weight: 800;
        margin-bottom: 2rem;
        color: $text;
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

    input[type="text"] {
        @extend %text-input;
        font-size: 1.1rem;
        width: calc(90% - 1.75rem);
        text-align: left;
        margin-bottom: 0rem;
    }

    .team-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
        width: 100%;
        text-align: left;
    }

    .other-options {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
        margin-bottom: 1.5rem;
        width: 100%;
        text-align: left;
    }

    .team-card {
        cursor: pointer;
        background: $background-1;
        border: 3px solid $border-color;
        border-radius: 1rem;
        padding: 1rem;
        transition: all 0.2s;
        position: relative;
        display: block;

        input[type="radio"] {
            position: absolute;
            opacity: 0;
            width: 0;
            height: 0;
        }

        &:hover {
            border-color: $gray-2;
            transform: translateY(-2px);
        }

        &.selected {
            border-color: $primary;
            box-shadow: 0 4px 12px rgba($primary, 0.15);
            transform: translateY(-2px);

            .team-name {
                color: $primary;
            }
        }

        .team-header {
            margin-bottom: 0.5rem;
        }

        .team-name {
            font-size: 1.2rem;
            font-weight: 700;
            color: $text;
            display: block;
        }

        .member-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .member-list li {
            font-size: 0.9rem;
            color: $gray-2;
            padding: 0.1rem 0;

            &.captain {
                font-weight: 600;
                color: $primary;
            }
        }

        .empty-team {
            margin: 0;
            font-size: 0.9rem;
            color: $text-muted;
            font-style: italic;
        }

        .card-input {
            margin-top: 1rem;
            width: 100%;
            box-sizing: border-box;
            font-size: 1rem;
            padding: 0.5rem;
        }
    }

    button#join-game {
        @extend %button;
        font-size: 1.25rem;
        width: 90%;
        padding: 0.8rem;
        background: $primary;
    }

    // Tournament game styles
    .tournament-info {
        color: $text-muted;
        font-size: 0.95rem;
        margin-bottom: 1rem;
    }

    .tournament-select {
        @extend %text-input;
        font-size: 1.1rem;
        width: 90%;
        cursor: pointer;
        margin-bottom: 1rem;
    }

    .no-players {
        color: $text-muted;
        font-style: italic;
        padding: 1rem;
    }
</style>
