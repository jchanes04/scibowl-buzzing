<script lang="ts">
    import updateTeam from "$lib/functions/updateTeam";

    import type { Member, Team } from "$lib/mongo";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import Confirm from "./Confirm.svelte";

    export let teamData: Team
    export let showNew: boolean = true

    console.log("x")
    $: memberList = Object.fromEntries(teamData.members.map(m => [m.id, m]))

    const modalStore: Writable<{
        component: ConstructorOfATypedSvelteComponent,
        props: Record<string, unknown>
    } | null> = getContext('modalStore')

    let displayTab: number | null = teamData.members[0]?.id ?? null
    $: console.log("displayTab", displayTab)

    async function saveTeamData() {
        await updateTeam(teamData)
    }

    function newMember(){
        const newId = Date.now()
        teamData.members = [
            ...teamData.members,
            {
                id: newId,
                firstName: '',
                lastName: '',
                discordUsername: '',
                grade: '9th'
            }
        ]
        displayTab = newId
        saveTeamData()
    }

    function removeMember(member: Member) {
        $modalStore = {
            component: Confirm,
            props: {
                headerText: "Confirm Delete",
                message: `Are you sure you want to delete ${member.firstName} ${member.lastName} from the team?`,
                cancelCallback: () => {
                    $modalStore = null
                },
                confirmCallback: async () => {
                    teamData.members = teamData.members.filter(x => x.id !== member.id)
                    saveTeamData()
                    $modalStore = null
                    displayTab = null
                }
            }
        }
    }
</script>

<div class="member-menu">
    <div class="tab-menu">
        {#each teamData.members as member (member.id)}
            <div class="tab" class:active={displayTab == member.id}>
                <button on:click={() => displayTab=member.id}>
                    {member?.firstName ? member.firstName : "New Student"}
                </button>
                <button class="icon" on:click={() => removeMember(member)}>x</button>
            </div>
        {:else}
            <div class="tab placeholder"></div>
        {/each}  
        {#if showNew && teamData.members.length < 5}
            <div class="tab add">
                <button on:click={newMember}>+</button>
            </div>
        {/if}
    </div>
    {#if displayTab && memberList[displayTab]}
        <slot member={memberList[displayTab]}></slot>
    {:else}
        <div class="no-selected">
            <h2>No member selected</h2>
        </div>
    {/if}
</div>

<style lang='scss'>
    .member-menu {
        position: relative;
        margin: auto;
        max-width: min(85vw, 1200px);
        margin-bottom: 2em;
    }
    
    .icon {
        display: inline-block;
        height: 0.75em;
        width: 0.75em;
        margin-left: 0em;
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
        
        button {
            background: transparent;
            padding: 0;
            margin: 0;
            border: none;
        }
    }

    .placeholder {
        height: 1.25em;
        background: var(--color-3);
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

    .no-selected {
        border: solid 5px var(--color-3);
        box-sizing: border-box;
        border-radius: 0 15px 15px 15px;
        padding-top: 1em;
        padding-bottom: 1em;
        padding-left: 3em;
    }
</style>