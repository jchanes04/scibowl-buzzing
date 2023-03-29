<script lang="ts">
    import getSocket from "$lib/socket";
    import type { ModeratorStore } from "$lib/stores/moderators";
    import type { PlayerStore } from "$lib/stores/players";
    import teamsStore from "$lib/stores/teams";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import Confirm from "./Confirm.svelte";
    import Icon from "./Icon.svelte";
    import kickSvg from "$lib/icons/kick.svg?raw"
    import badgeSvg from "$lib/icons/badge.svg?raw"

    export let member: PlayerStore | ModeratorStore
    export let showControls = false

    const socket = getSocket()
    type ModalStore = Writable<{
        component: ConstructorOfATypedSvelteComponent,
        props: Record<string, unknown>
    } | null>
    const modalStore: ModalStore = getContext('modalStore')

    function promote() {
        $modalStore = {
            component: Confirm,
            props: {
                title: 'Promote ' + $member.name,
                message: 'Are you sure you want to promote ' + $member.name + ' to moderator?',
                cancelCallback: () => {
                    $modalStore = null
                },
                confirmCallback: () => {
                    socket.emit('promotePlayer', member.id)
                    $modalStore = null
                }
            }
        }
    }

    function kick() {
        $modalStore = {
            component: Confirm,
            props: {
                title: 'Kick ' + $member.name,
                message: 'Are you sure you want to kick ' + $member.name + '?',
                cancelCallback: () => {
                    $modalStore = null
                },
                confirmCallback: () => {
                    socket.emit('kickPlayer', member.id)
                    $modalStore = null
                }
            }
        }
    }
</script>

{#if $member.type === "moderator"}
    <li class="moderator">
        {$member.name}
    </li>
{:else}
    <li>
        {$member.name}
        <span class="team">({$teamsStore[$member.team.id]?.name})</span>
        {#if showControls}
            <div class="controls">
                <button on:click={kick}>
                    <Icon svg={kickSvg} />
                </button>
                <button on:click={promote}>
                    <Icon svg={badgeSvg} />
                </button>
            </div>
        {/if}
    </li>
{/if}

<style lang="scss">
    @use '$styles/_global.scss' as *;

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
        color: $orange;
    }

    .controls {
        margin-left: auto;
        visibility: hidden;
    }

    button {
        display: inline-block;
        height: 1em;
        width: 1em;
        cursor: pointer;
        border: none;
        background: transparent;
        padding: 0;
        font-size: 20px;
    }
</style>