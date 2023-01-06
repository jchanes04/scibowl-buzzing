<script lang="ts">
    import deleteTeam from "$lib/functions/deleteTeam";
    import postTeam from "$lib/functions/postTeam";
    import type { Member, Team } from "$lib/mongo";
    import warnStore from "$lib/stores/warn";
    import { createEventDispatcher } from "svelte";
    export let teams: Team[]
    export let selectedTeamId: string
    $: console.log(selectedTeamId)

    async function addteam(){
        const newId = Date.now()
        const createdTeam = await postTeam({
            teamName: getNextTeamName(teams),
            members: [{
                id: newId,
                firstName: getNextPlayerName([]),
                lastName: '',
                discordUsername: '',
                grade: '9th'
            }],
        })
        teams = [
            ...teams,
            createdTeam
        ]
        dispatch('select', createdTeam)
    }

    $: $warnStore.state && removeTeam()

    function getNextPlayerName(tabs: Member[]) {
        let number = 1
        while (tabs.some(t => t.firstName === "New Player " + number)) {
            number++
        }
        return "New Player " + number
    }

    function getNextTeamName(teams: Team[]) {
        let number = 1
        while (teams.some(t => t.teamName === "New Team " + number)) {
            number++
        }
        return "New Team " + number
    }

    const dispatch = createEventDispatcher()

    function removeTeam() {   
        if ($warnStore.state=='accept' && $warnStore.type == 'teamRemove') { 
            const removedTeamIndex = teams.findIndex(e => e==$warnStore.object)
            teams = teams.filter(e => e != $warnStore.object) 
            if (!teams.length) addteam()
            console.dir(teams)
            
            dispatch('select', removedTeamIndex>teams.length-1? teams[removedTeamIndex-1]:teams[removedTeamIndex])
            deleteTeam($warnStore.object as Team)
            $warnStore.state = 'closed'
        } else if ($warnStore.state=='decline'){
            $warnStore.object = null
            $warnStore.state = 'closed'
        }
    }


    function teamSelect(team: Team) {
        dispatch('select', team)
    }
</script>

<div class="team-select">
    <h1>Your Teams</h1>
    <div class="team-list">
        {#each teams as t}
            <div class="team" class:selected={selectedTeamId === t.id} on:click={()=>{teamSelect(t)}}>
                <p>{t.teamName}</p>
                <span class="icon" on:click={() => {$warnStore = {
                    state:'open',
                    message:[`Are you sure you want to remove ${t.teamName}?`, `(This action cannot be undone)`],
                    type:'teamRemove',
                    object:t
                }}} />
            </div>
        {/each}
        {#if teams.length < 3}
            <div class='team' on:click={addteam}>
                <p>+ Add New Team</p>
            </div>
        {/if}
        
        <div class='team' class:selected={selectedTeamId === "payment"} on:click={()=>{teamSelect(null)}}>
            <h1 id="price">Payment</h1>
        </div>
    </div>
</div>

<style lang="scss">
    .team-select {
        border-radius: 0px 15px 0 0;
        padding: 1em 0em;
        background-color: white;
        width: 100%;
        height: 100%;
        box-sizing: border-box;

    }
    h1 {
        margin: .3em .4em;
    }

    .icon {
        display: inline-block;
        height: 1em;
        width: 1em;
        background-size: cover;
        vertical-align: middle;
        margin-left: -.3em;
        margin-top: -.2em;
        background-image: url('/close-menu.svg');
        filter: brightness(0);
    }
    
    .team-list {
        display: flex;
        flex-direction: column;
    }
    p{
        display:inline-block;
        padding: 0 .8em;
        
    }
    .team {
        padding: .6em;
        cursor: pointer;
        transition: .2s;
        position: relative;
        &:hover {
            background-color: var(--color-3);
        }
    }

    .selected::before {
        content:  '';
        display: block;
        height: 100%;
        width: 8px;
        background-color: var(--color-2);
        position: absolute;
        left: 5px;
        top: 0;
    }
</style>
