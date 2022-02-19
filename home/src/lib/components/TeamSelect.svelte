<script lang="ts">
    import deleteTeam from "$lib/functions/deleteTeam";
    import postTeam from "$lib/functions/postTeam";
    import type { Team } from "$lib/mongo";
    import { createEventDispatcher } from "svelte";

    export let teams: Team[]
    async function addteam(){
        const createdTeam = await postTeam({
            teamName: getNextTeamName(teams),
            members: [],
        })
        teams = [
            ...teams,
            createdTeam
        ]
        dispatch('select', createdTeam)
    }

    function getNextTeamName(teams: Team[]) {
        let number = 1
        while (teams.some(t => t.teamName === "New Team " + number)) {
            number++
        }
        return "New Team " + number
    }

    const dispatch = createEventDispatcher()

    function  removeTeam(team:Team) {    
        teams = teams.filter(e => e != team)
        console.dir(teams)
        dispatch('select', teams[0])
        deleteTeam(team)
    }

    function teamSelect(team: Team) {
        dispatch('select', team)
    }
</script>

<div class="team-select">
    <h1>Your Teams</h1>
    <div class="team-list">
        {#each teams as t}
            <div class="team" on:click={()=>{teamSelect(t)}}>
                <p>{t.teamName}</p><span on:click={() => {removeTeam(t)}}>-</span>
            </div>
        {/each}
        {#if teams.length<3}
            <div class='team' on:click={addteam}>
                <p>+ Add New Team</p>
            </div>
        {/if}
    </div>
</div>

<style lang="scss">
    .team-select {
        border-radius: 0px 15px 0 0;
        padding: 1em;
        background-color: white;
        width: 100%;
        box-sizing: border-box;
    }

    .team-list {
        display: flex;
        flex-direction: column;
    }
    p{
        display:inline-block;
        padding: 0 0.5em;
    }
    .team {
        padding: .6em;
        cursor: pointer;
        &:hover {
            background-color: grey;
        }
    }
</style>
