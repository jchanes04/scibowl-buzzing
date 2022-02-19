<script lang="ts">
    import updateTeam from "$lib/functions/updateTeam";

    import type { Member, Team } from "$lib/mongo";
    import type { SvelteComponentTyped } from "svelte";
    import MemberEdit from "./MemberEdit.svelte";

    let displayTab: number  
    export let teamData: Team
    
    let tabs: Member[] = teamData.members.filter(m => m)
    $: console.dir(tabs)

    $: updateTabs(teamData)

    displayTab = tabs.length ? tabs[0].id : null

    let tabComponents: SvelteComponentTyped[] = []

    function updateTabs(teamData) {
        tabs = teamData.members
    }

    function saveTeamData() {
        console.dir(tabComponents)
        const newMemberData: Member[] = tabComponents.map(c => c?.getMemberData())
        tabs = newMemberData.filter(d => d)
        teamData.members = newMemberData.filter(d => d)
        updateTeam(teamData)
    }

    function newPlayer(){
        const newId = Date.now()
        tabs = [
            ...tabs,
            {
                id: newId,
                firstName: getNextPlayerName(tabs),
                lastName: '',
                discordUsername: '',
                grade: '9th'
            }
        ]
        displayTab = newId
    }

    function getNextPlayerName(tabs: Member[]) {
        let number = 1
        while (tabs.some(t => t.firstName === "New Player " + number)) {
            number++
        }
        return "New Player " + number
    }

    function removePlayer(player: Member) {
        tabs = tabs.filter(e => e !== player)
        if (player.id === displayTab) {
            const removedPlayerIndex = tabs.findIndex(t => t.id === displayTab)
            console.log(removedPlayerIndex)
            displayTab = removedPlayerIndex > 0
                ? removedPlayerIndex - 1
                : null
        }
    }
</script>

<div class="member-menu">
    
    <div class="tab-menu">
        {#each tabs as player}
            {#if player}
                <div class="tab" class:active={displayTab == player.id} on:click={() => displayTab=player.id}>
                    <p>{player?.firstName ? player.firstName : "New Student"}</p><span style="margin-left: 0.5em;" on:click={() => removePlayer(player)}>x</span>
                </div>
            {/if}
        {/each}  
        {#if tabs.length<5}
            <div class="tab add" on:click={newPlayer}>
                <p>+</p>
            </div>
        {/if}
    </div>
    <div>
        {#each tabs as player, i}
            {#if player}
                <div>
                    <MemberEdit shown={player.id==displayTab} bind:player={player} bind:this={tabComponents[i]}></MemberEdit>
                </div>
            {:else}
                <p>{JSON.stringify(player)}</p>
            {/if}
        {/each}
    </div>
    <div>
        <button on:click={saveTeamData}>Save & Submit</button>
    </div>
</div>

<style lang='scss'>
    .member-menu {
        padding: 1em;
    }

    p {
        padding: 0;
        margin: 0;
    }

    .tab-menu {
        display: flex;
        gap: 2px;
        flex-direction: row;
        align-items: end;
        height: 1.65em;
        margin-bottom: 1px;
        min-width: 0px;
        max-width: 100%;
    }

    .tab {
        border-radius: .6em .2em 0em 0em;
        background-color: var(--color-6);
        color: white;
        padding:.12em 1em;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0px;
        flex-shrink: 1;

        p {
            display: inline-block;
            padding: 0 0.5em;
        }
    }

    .add {
        background-color: var(--color-2);
        padding: 0.12em 0.2em;
    }

    .tab.active{
        color: black;
        background-color: var(--color-3);
        padding-bottom: 0.2em;
        padding-top: 0.2em;
        transition: padding 0.1s ease-out;
        margin-bottom: -1px;
    }
</style>