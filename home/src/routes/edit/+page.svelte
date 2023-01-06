<script lang="ts">
    import type { Team } from '$lib/mongo';
    import type { SvelteComponentTyped } from 'svelte';
    import type { PageData } from './$types';

    export let data: PageData

    let { teams } = data
    let selectedTeam: Team = teams[0]
    let editingTeamName = false
    let teamNameWrapper: HTMLElement
    let mobileMenuOpen = false
    let mobileMenuElement: HTMLElement
    let memberMenuComponent: SvelteComponentTyped

    function handleTeamSelect(e: CustomEvent<Team>) {
        selectedTeam = e.detail
        mobileMenuOpen = false
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
            memberMenuComponent.setDirty(true)
        }
    }

    function handleWindowClick(e: MouseEvent) {
        if (teamNameWrapper && !teamNameWrapper.contains(e.target as Node)) {
            editingTeamName = false
            teams = teams
            memberMenuComponent.setDirty(true)
        }

        if (mobileMenuElement && !mobileMenuElement.contains(e.target as Node) && mobileMenuElement !== e.target) {
            mobileMenuOpen = false
        }
    }
</script>

<svelte:head>
    <title>Edit your teams</title>
    <meta name="description" content="Edit your teams and register new ones to participate in ESBOT" />
</svelte:head>

<svelte:window on:click={handleWindowClick}></svelte:window>
<h1>Editing team information will be available soon.</h1>
<!-- <div>
    {#if !($warnStore.state=='closed')}
        <div id="background-dim"></div>
        <Warn />
    {/if}
    <main>
        <div id='teamSelect'>
            <TeamSelect bind:teams={teams} on:select={handleTeamSelect} selectedTeamId={selectedTeam?.id || "payment"} />
        </div>
        <div id='mobileTeamSelect' class:open={mobileMenuOpen} bind:this={mobileMenuElement}>
            <TeamSelect bind:teams={teams} on:select={handleTeamSelect} selectedTeamId={selectedTeam?.id || "payment"} />
            <span id="open" on:click={()=>{mobileMenuOpen=!mobileMenuOpen}}>{mobileMenuOpen? '<':'>'}</span>
        </div>
        {#if selectedTeam}
            <div class="edit-menu" >
                <div class="team-name" bind:this={teamNameWrapper}>
                    {#if !editingTeamName}
                        <h1 on:click={toggleTeamNameEdit}>{selectedTeam.teamName}<span class="icon edit"></span></h1>
                    {:else}
                        <input id="teamNameInputElement" type='text' bind:value={selectedTeam.teamName} on:keydown={handleKeydown} />
                    {/if}
                </div>
                <MemberMenu bind:this={memberMenuComponent} teamData={selectedTeam} />
            </div>
        {:else} 
            {#if false}
                <Payment bind:teams></Payment>
            {:else}
                <div>
                    <h2>No team selected. </h2>
                    <h2>Select a team from the left or make a new team.</h2>
                </div>
            {/if}
        {/if}
        
    </main>
</div> -->
<style lang="scss">
    
    h2{
        display: inline-block;
        margin: .5em 0em;
        margin-right: .2em;
    }
    
    
    #teamSelect {
        width: 100%;
        box-sizing: border-box;
        @media (max-width:650px) {
            display: none;
        }        
    }
    

    #open {
        position: relative;
        font-size: 24px;
        left: min(12em,70vw);
        top:-93vh;
        background-color: var(--color-2);
        color: white;
        padding: .4em .6em;
        border-radius: 0em .5em .5em 0em;
        cursor: pointer;

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
        top: 0px;
        left: max(-18em,-70vw);
        border-top: 4px solid var(--color-2);
        transition: .5s;

        @media (max-width:650px) {
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
        @media (max-width:650px) {
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