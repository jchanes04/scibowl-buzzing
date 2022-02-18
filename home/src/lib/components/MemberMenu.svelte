<script lang="ts">
    import type { Member, Team } from "$lib/mongo";
    import type { SvelteComponentTyped } from "svelte";
    import MemberEditTab from "./MemberEditTab.svelte";

    let displayTab: string  
    export let teamData: Team
    
    let tabs: Member[] = teamData.members.length 
        ? [{ } as Member]
        : teamData.members

    let tabComponents: SvelteComponentTyped[] = []

    function saveTeamData() {
        const newMemberData: Member[] = tabComponents.map(c => c.getMemberData())
    }
</script>


<div class="tab-menu">
    {#each tabs as player}
        <div class="tab" class:active={displayTab == player.firstName} on:click={() => displayTab=player.firstName}>
            <p>{player.firstName? player.firstName : "New Student"}</p>
        </div>
    {/each}    
</div>
<div>
    {#each tabs as player, i}
        <MemberEditTab bind:player={player} bind:this={tabComponents[i]}></MemberEditTab>
    {/each}
</div>
<div>
    <button on:click={saveTeamData}>Save & Submit</button>
</div>

<style lang='scss'>
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
    }

    .tab {
        border-radius: .6em .2em 0em 0em;
        background-color: var(--color-6);
        color: white;
        padding:.12em 1em;
        cursor: pointer;
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