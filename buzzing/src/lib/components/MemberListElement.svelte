<script lang="ts">
    import type { MemberData } from "$lib/classes/Member";
    import kickPlayer from "$lib/functions/kickPlayer";
    import modalStore from "$lib/stores/modal";
    import teamsStore from "$lib/stores/teams";

    export let member: MemberData
    export let showControls = false

    function promote() {
        
    }

    function kick() {
        $modalStore = {
            title: 'Kick ' + member.name,
            message: 'Are you sure you want to kick ' + member.name + '?',
            options: [
                {
                    text: 'Cancel',
                    callback: () => {
                        $modalStore = null
                    }
                },
                {
                    text: 'Kick',
                    callback: () => kickPlayer(member)
                }
            ]
        }
    }
</script>

{#if member.moderator}
    <li class="moderator">
        {member.name}
    </li>
{:else}
    <li>
        {member.name} 
        <span class="team">({$teamsStore.find(t => t.id = member.teamID).name})</span>
        {#if showControls}
            <div class="controls">
                <span class="icon kick" on:click={kick} />
                <span class="icon promote" on:click={promote} />
            </div>
        {/if}
    </li>
{/if}

<style lang="scss">
    li {
        font-size: 20px;
        margin-left: 1em;
        display: flex;
        flex-direction: row;
        align-items: center;

        .team {
            color: grey;
            font-size: 16px;
            margin-left: 0.5em;
        }

        &:hover .controls {
            visibility: visible;
        }
    }

    .moderator {
        color: var(--orange);
    }

    .controls {
        margin-left: auto;
        visibility: hidden;
    }

    .icon {
        display: inline-block;
        height: 1em;
        width: 1em;
        cursor: pointer;
    }

    .kick {
        background-image: url('/shield.svg');
    }

    .promote {
        background-image: url('/badge.svg');
    }
</style>