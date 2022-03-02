<script context="module" lang="ts">
    import type { LoadInput, LoadOutput } from '@sveltejs/kit'
    import TeamSelect from "$lib/components/TeamSelect.svelte";
    export async function load({ session, fetch }: LoadInput): Promise<LoadOutput> {
        if (!session.loggedIn) {
            return {
                status: 302,
                redirect: "/register"
            }
        } else {   
            const teamsRes = await Promise.all(session.userData.teamIds.map(t => fetch('/api/teams/' + t)))
            const resolvedTeams = teamsRes.filter(t => t.status === 200)
            const teams = await Promise.all(resolvedTeams.map(t => t.json() as Promise<Team>))

            return {
                props: {
                    teams
                }
            }
        }
    }
</script>

<script lang="ts">
    import MemberMenu from '$lib/components/MemberMenu.svelte';
    import type { Team } from '$lib/mongo';

    export let teams: Team[]

    let selectedTeam: Team = null
    let editingTeamName = false
    let teamNameWrapper: HTMLElement

    function handleTeamSelect(e: CustomEvent<Team>) {
        selectedTeam = e.detail
    }

    function toggleTeamNameEdit() {
        setTimeout(() => {
            editingTeamName = !editingTeamName 
        })
    }

    function handleKeydown(e: KeyboardEvent){
        if (e.key === 'Enter') {
            toggleTeamNameEdit()
            teams = teams
        }
    }

    function handleWindowClick(e: MouseEvent) {
        if (teamNameWrapper && !teamNameWrapper.contains(e.target as Node)) {
            editingTeamName = false
            teams = teams
        }
    }
</script>


<svelte:window on:click={handleWindowClick}></svelte:window>

<main>
    <TeamSelect bind:teams={teams} on:select={handleTeamSelect}/>
    {#if selectedTeam}
        <div class="edit-menu" >
            <div class="team-name" bind:this={teamNameWrapper}>
                {#if !editingTeamName}
                    <h1 on:click={toggleTeamNameEdit}>{selectedTeam.teamName}<span class="icon edit"></span></h1>
                {:else}
                    <input id="teamNameInputElement" type='text' bind:value={selectedTeam.teamName} on:keydown={handleKeydown} />
                {/if}
            </div>
            <MemberMenu teamData={selectedTeam} />
        </div>
    {:else}
        <div>
            <h2>No team selected</h2>
        </div>
    {/if}
</main>

<style lang="scss">
    input[type="text"] {
        padding: 0.3em;
        font-size: 20px;
        margin: 0.5em auto;
        border: none;
        border-radius: 0.3em;
        box-sizing: border-box;
        max-width: 80%;
        text-align: left;
        font-family: 'Ubuntu';
        position: relative;
        &:focus::placeholder {
            color: transparent;
        }
    }


    main {
        display: grid;
        height: 100%;
        grid-template-columns: minmax(300px, 1fr)  3fr;
        grid-template-rows: 1fr;
        padding-top: 2em;
        column-gap: 2em;
        box-sizing: border-box;
    }

    h1 {
       display: inline-block;
       cursor: pointer;
    }

    .icon {
        display: inline-block;
        height: 0.75em;
        width: 0.75em;
        background-size: cover;
        vertical-align: middle;
        margin-left: 0.5em;
    }

    .edit {
        background-image: url('/pencil.png');
    }
</style>