<script lang="ts">
    import updateTeam from "$lib/functions/updateTeam";

    import type { Member, Team } from "$lib/mongo";
    import warnStore from "$lib/stores/Warn";
    import type { SvelteComponentTyped } from "svelte";
    import MemberEdit from "./MemberEdit.svelte";

    let displayTab: number  
    export let teamData: Team

    let dirty = false

    let tabs: Member[] = teamData.members.filter(m => m)
    let tabWidths: number[] = []
    
    $: $warnStore.state && removePlayer()    
    $: updateTabs(teamData)

    displayTab = tabs.length ? tabs[0].id : null

    let tabComponents: SvelteComponentTyped[] = []

    function updateTabs(teamData) {
        tabs = teamData.members
        displayTab = tabs[0].id
        dirty = false
    }

    async function saveTeamData() {
        console.dir(tabComponents)
        const newMemberData: Member[] = tabComponents.map(c => c?.getMemberData())
        tabs = newMemberData.filter(d => d)
        teamData.members = newMemberData.filter(d => d)
        await updateTeam(teamData)
        dirty = false
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
        dirty = true
    }

    function getNextPlayerName(tabs: Member[]) {
        let number = 1
        while (tabs.some(t => t.firstName === "New Player " + number)) {
            number++
        }
        return "New Player " + number
    }

    function removePlayer() {
        if ($warnStore.state=='accept' && $warnStore.type=='memberRemove'){
            const removedPlayerIndex = tabs.findIndex(t => t.id === displayTab)
            tabs = tabs.filter(e => e !== $warnStore.object)
            if (!tabs.length) newPlayer()
            if ($warnStore.object.id === displayTab) {
                console.dir(removedPlayerIndex)
                displayTab = removedPlayerIndex>tabs.length-1 ? tabs[removedPlayerIndex-1]?.id : tabs[removedPlayerIndex]?.id
            }
            $warnStore.state = 'closed'
            $warnStore.object = null
            dirty = true
        } else if ($warnStore.state=='decline') {
            $warnStore.state = 'closed'
            $warnStore.object = null
        }   
    }

    export function setDirty(value: boolean) {
        console.log('dirty: ' + value)
        dirty = value
    }
</script>

<div class="member-menu">
    <div class="tab-menu">
        {#each tabs as player, i}
            {#if player}
                <div class="tab" class:active={displayTab == player.id} on:click={() => displayTab=player.id} bind:clientWidth={tabWidths[i]}>
                    <p>{player?.firstName ? player.firstName : "New Student"}</p>
                    <span class="icon" on:click={() => {$warnStore = {
                        state:'open',
                        message:[`Are you sure you want to remove ${player.firstName}?`,`(This action will not be saved until you press "Save & Submit")`],
                        type:'memberRemove',
                        object:player
                    }}} />
                </div>
            {/if}
        {/each}  
        {#if tabs.length<5}
            <div class="tab add" on:click={newPlayer}>
                <p>+</p>
            </div>
        {/if}
    </div>
    <div id="edit">
        {#each tabs as player, i}
            {#if player}
                <div>
                    <MemberEdit shown={player.id==displayTab} bind:player={player} bind:this={tabComponents[i]} on:change={() => dirty = true} />
                </div>
            {:else}
                <p>{JSON.stringify(player)}</p>
            {/if}
        {/each}
    </div>
    <div>
        <button on:click={saveTeamData} disabled={!dirty}>Save & Submit</button>
    </div>
</div>

<style lang='scss'>
    .member-menu {
        padding: 1em;
        position: relative;
        max-width: calc(75vw - 5em);
        @media (max-width:1200px) {
            max-width: calc(100vw - 5em - 300px)
        }
        @media (max-width:650px) {
            max-width: calc(100vw - 2em)
        }
    }
    span{
        position: relative;
    }
    p {
        padding: 0;
        margin: 0;
    }
    
    .icon {
        display: inline-block;
        height: 0.75em;
        width: 0.75em;
        background-size: cover;
        vertical-align: middle;
        margin-left: 0em;
        background-image: url('/close-menu.svg');
        filter: brightness(0);
    }

    *::-webkit-scrollbar {
        height: 4px;
    }
    * {
        scrollbar-width: thin;
    }
    *::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.4);
        border-radius: 2px;
        height: 4px;
        border: 0px solid rgba(0, 0, 0, 0);
        background-clip: padding-box;
    }

    *::-webkit-scrollbar-corner {
        display: none;
    }

    .tab-menu {
        display: flex;
        gap: 2px;
        flex-direction: row;
        align-items: end;
        height: 2em;
        margin-bottom: 0px;
        min-width: 0px;
        position: relative;
        overflow-x: auto;
        overflow-y: hidden;
    }

    .tab:not(.active) {
        margin-bottom: 1px;
    }

    .tab {
        display: inline-block;
        border-radius: .6em .2em 0em 0em;
        background-color: var(--color-2);
        color: white;
        padding:.12em 1em;
        cursor: pointer;
        white-space: nowrap;
        
        min-width: 0px;
        flex-shrink: 0;
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

    button {
        padding: 0.5em;
        margin: .5em;
        color: #EEE;
        background: var(--color-2);
        border-radius: 0.3em;
        font-weight: bold;
        border: solid black 3px;
        font-size: 18px;
        cursor: pointer;
        width: 15ch;

        &:disabled {
            border: solid var(--color-2) 3px;
            background: transparent;
            color: #444;
            cursor: default;
        }
    }
</style>