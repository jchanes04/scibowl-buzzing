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
    import HelpBox from '$lib/components/HelpBox.svelte';
    import MemberMenu from '$lib/components/MemberMenu.svelte';
    import Payment from '$lib/components/Payment.svelte';
    import Warn from '$lib/components/Warn.svelte';
    import type { Team } from '$lib/mongo';
    import warnStore from '$lib/stores/Warn';

    export let teams: Team[]
    let selectedTeam: Team = teams[0]
    let editingTeamName = false
    let teamNameWrapper: HTMLElement
    let mobileMenuOpen = false    


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
<div>
    {#if !($warnStore.state=='closed')}
        <div id="background-dim"></div>
        <Warn />
    {/if}
    <main>
        <div id='teamSelect'><TeamSelect bind:teams={teams} on:select={handleTeamSelect} /></div>
        <div id='mobileTeamSelect' class:open={mobileMenuOpen}><TeamSelect bind:teams={teams} on:select={handleTeamSelect} /><span id="open" on:click={()=>{mobileMenuOpen=!mobileMenuOpen}}>{mobileMenuOpen? '<':'>'}</span></div>
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
            {#if selectedTeam==null}
                <Payment bind:teams></Payment>
            {:else}
            <div>
                <h2>No team selected</h2>
            </div>
            {/if}
        
        {/if}
        
    </main>
</div>
<style lang="scss">
    
    h2{
        display: inline-block;
        margin: .5em 0em;
        margin-right: .2em;
    }
    
    
    #teamSelect {
        width: 100%;
        box-sizing: border-box;
        @media (max-width:600px) {
            display: none;
        }        
    }
    

    #open {
        position: relative;
        font-size: 24px;
        left: min(12em,70vw);
        top:-96vh;
        background-color: white;
        padding: .4em .6em;
        border-radius: 0em .5em .5em 0em;
        @media (max-height:650px) {
            top:-95vh  
        }
        @media (max-height:450px) {
            top:-94vh
        }
        @media (max-height:350px) {
            top:-93vh
        }
    }

    #mobileTeamSelect {
        box-sizing: border-box;
        z-index: 90;
        position: fixed;
        display: none;
        height: 100%;
        width: min(18em,70vw);
        top:40px;left: max(-18em,-70vw);
        transition: .5s;
        @media (max-width:600px) {
            display: block;
        }
        &.open{
            left: 0px;
        }
    }


    #background-dim {
        z-index:998;
        position: absolute;
        height:100vh;width:100vw;top:0;left:0;
        background-color: #000000CC;
    }

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
        max-width: 100vw;
        grid-template-columns: minmax(300px, 1fr)  3fr;
        grid-template-rows: 1fr;
        padding-top: 2em;
        column-gap: 2em;
        box-sizing: border-box;
        @media (max-width:600px) {
            grid-template-columns: 1fr;
        }
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