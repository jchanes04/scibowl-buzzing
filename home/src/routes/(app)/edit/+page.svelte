<script lang="ts">
    import type { Team } from '$lib/mongo';
    import type { PageData } from './$types';
    import { userStore } from '$lib/stores/user';
    import MemberMenu from '$lib/components/MemberMenu.svelte';
    import Select from "svelte-select"
    import Payment from '$lib/components/Payment.svelte';

    export let data: PageData
    let { teams } = data
    $: ({ teams } = data)

    let selectedTeam: Team = teams[0] ?? null
    let mobileMenuOpen = false
    let mobileMenuElement: HTMLElement


    function createTeam() {
        
    }


    function handleRename() {
        
    }
</script>

<svelte:head>
    <title>Edit your teams</title>
    <meta name="description" content="Edit your teams and register new ones to participate in ESBOT" />
</svelte:head>

<main>
    {#if $userStore.verified}
        <div class='menu'>
            <div class="select-wrapper">
                <Select items={teams} id="id" label="name"  bind:value={selectedTeam} clearable={false} />
            </div>
            <button class="create-team" on:click={createTeam}>+</button>
            <button class="rename-team" on:click={handleRename}>Rename</button>
            <button class="pay" on:click={handlePayment}>Pay</button>
            <button class="delete-team" on:click={handleDelete}></button>
        </div>
        <div id='mobileTeamSelect' class:open={mobileMenuOpen} bind:this={mobileMenuElement}>
            <span id="open" on:click={()=>{mobileMenuOpen=!mobileMenuOpen}}>{mobileMenuOpen? '<':'>'}</span>
        </div>
        {#if selectedTeam}
            <div class="edit-menu">
                <div class="team-name" bind:this={teamNameWrapper}>
                    {#if !editingTeamName}
                        <h1 on:click={toggleTeamNameEdit}>{selectedTeam.teamName}<span class="icon edit"></span></h1>
                    {:else}
                        <input id="teamNameInputElement" type='text' bind:value={selectedTeam.teamName} />
                    {/if}
                </div>
                <MemberMenu teamData={selectedTeam} />
            </div>
        {:else} 
            <div>
                <h2>No team selected. </h2>
                <h2>Select a team or make a new team.</h2>
            </div>
        {/if}
        
    {:else}
        <h1>You have not verified your email yet</h1>
        <p class="message">
            After registering, you should have received an email with a link to verify your account sent to your primary email (the one used to log in).
            If you have not received a verification email, please reach out to the tournament orgaizers on Discord or at <a href="mailto:enloescibowl@gmail.com">enloescibowl@gmail.com</a>
        </p>
    {/if}
</main>

<style lang="scss">
    h1 {
        text-align: center;
    }

    .message {
        max-width: 70ch;
        text-align: center;
        margin: auto;
    }

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