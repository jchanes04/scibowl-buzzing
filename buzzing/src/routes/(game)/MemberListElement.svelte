<script lang="ts">
    import getSocket from "$lib/socket";
    import type { ModeratorStore } from "$lib/stores/moderators";
    import type { PlayerStore } from "$lib/stores/players";
    import teamsStore from "$lib/stores/teams";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import Confirm from "$lib/components/Confirm.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import kickSvg from "$lib/icons/kick.svg?raw"
    import badgeSvg from "$lib/icons/badge.svg?raw"
    import editNameSvg from "$lib/icons/edit-name.svg?raw"
    import TextField from "$lib/components/TextField.svelte";

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
                cancelCallback: () => $modalStore = null,
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
                cancelCallback: () => $modalStore = null,
                confirmCallback: () => {
                    socket.emit('kickPlayer', member.id)
                    $modalStore = null
                }
            }
        }
    }

    function rename() {
        $modalStore = {
            component: TextField,
            props: {
                title: "Rename Player",
                message: `Change player name "${$member.name}" to :`,
                options: {
                    defaultValue: $member.name,
                    fieldName: "New name"
                },
                cancelCallback: () => $modalStore = null,
                confirmCallback: (value: string) => {
                    socket.emit("renamePlayer", member.id, value)
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
                <button on:click={promote}>
                    <Icon svg={badgeSvg} />
                </button>
                <button on:click={kick}>
                    <Icon svg={kickSvg} />
                </button>
                <button on:click={rename}>
                    <Icon svg={editNameSvg} />
                </button>
            </div>
        {/if}
    </li>
{/if}

<style lang="scss">
    @use '$styles/_global.scss' as *;

    li {
        font-size: 1rem;
        padding: 0.5em 0.75em;
        border-radius: 0.5em;
        display: flex;
        flex-direction: row;
        align-items: center;
        transition: background-color 0.2s;

        &:hover {
            background-color: $background-2;

            .controls {
                opacity: 1;
            }
        }

        .team {
            color: $gray-2;
            font-size: 0.8rem;
            margin-left: 0.5em;
        }
    }

    .moderator {
        color: $orange;
        font-weight: 600;
    }

    .controls {
        margin-left: auto;
        opacity: 0;
        display: flex;
        gap: 0.25em;
        transition: opacity 0.2s;
    }

    button {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 1.75em;
        width: 1.75em;
        cursor: pointer;
        border: none;
        background: transparent;
        padding: 0;
        font-size: 1.1rem;
        border-radius: 0.25em;
        transition: all 0.2s;
        color: $gray-2;

        &:hover {
            background: rgba($primary, 0.1);
            color: $primary;
        }

        &:nth-child(2):hover {
            background: rgba($red, 0.1);
            color: $red;
        }
    }
</style>