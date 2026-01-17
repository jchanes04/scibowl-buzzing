<script lang="ts">
    import getSocket from "$lib/socket.svelte";
    import type {
        ClientModerator,
        ClientPlayer,
    } from "$lib/stores/members.svelte";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import Confirm from "$lib/components/Confirm.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import kickSvg from "$lib/icons/kick.svg?raw";
    import badgeSvg from "$lib/icons/badge.svg?raw";
    import editNameSvg from "$lib/icons/edit-name.svg?raw";
    import TextField from "$lib/components/TextField.svelte";
    import { useConvexClient } from "convex-svelte";
    import { api } from "../../../convex/_generated/api";
    import gameIdStore from "$lib/stores/gameId.svelte";

    interface Props {
        member: ClientPlayer | ClientModerator;
        showControls?: boolean;
    }

    let { member, showControls = false }: Props = $props();

    const socket = getSocket();
    const convex = useConvexClient();
    type ModalStore = Writable<{
        component: any;
        props: Record<string, unknown>;
    } | null>;
    const modalStore: ModalStore = getContext("modalStore");

    function promote() {
        $modalStore = {
            component: Confirm,
            props: {
                title: "Promote " + member.name,
                message:
                    "Are you sure you want to promote " +
                    member.name +
                    " to moderator?",
                cancelCallback: () => ($modalStore = null),
                confirmCallback: async () => {
                    const gId = gameIdStore.value;
                    if (gId) {
                        // Update Convex first
                        await convex.mutation(api.gameMembers.promote, {
                            gameId: gId,
                            memberId: member.id,
                        });

                        // Then emit socket to disconnect and reconnect // todo confirm this
                        socket.emit("promotePlayer", member.id);
                    }

                    $modalStore = null;
                },
            },
        };
    }

    function kick() {
        $modalStore = {
            component: Confirm,
            props: {
                title: "Kick " + member.name,
                message: "Are you sure you want to kick " + member.name + "?",
                cancelCallback: () => ($modalStore = null),
                confirmCallback: async () => {
                    const gId = gameIdStore.value;
                    if (gId) {
                        // Server handles the Convex kick mutation
                        // Just emit socket event
                        socket.emit("kickPlayer", member.id);

                        // Add chat message via socket
                        socket.emit("addChatMessage", {
                            type: "notification",
                            text: `${member.name} has been kicked`,
                        });
                    }

                    $modalStore = null;
                },
            },
        };
    }

    function rename() {
        const oldName = member.name;
        $modalStore = {
            component: TextField,
            props: {
                title: "Rename Player",
                message: `Change player name "${member.name}" to :`,
                options: {
                    defaultValue: member.name,
                    fieldName: "New name",
                },
                cancelCallback: () => ($modalStore = null),
                confirmCallback: async (value: string) => {
                    const gId = gameIdStore.value;
                    if (gId) {
                        // Update Convex first
                        await convex.mutation(api.gameMembers.rename, {
                            gameId: gId,
                            memberId: member.id,
                            name: value,
                        });
                    }

                    $modalStore = null;
                },
            },
        };
    }

    async function toggleSub() {
        const gId = gameIdStore.value;
        if (gId && member.type === "player") {
            const newSubStatus = !(member as ClientPlayer).isSubbed;

            // Update Convex
            await convex.mutation(api.gameMembers.setSub, {
                gameId: gId,
                memberId: member.id,
                isSubbed: newSubStatus,
            });

            // Emit socket for instant UI update
            socket.emit("setPlayerSub", member.id, newSubStatus);

            // Add chat message
            socket.emit("addChatMessage", {
                type: "notification",
                text: newSubStatus
                    ? `${member.name} has been subbed out`
                    : `${member.name} is now in play`,
            });
        }
    }
</script>

{#if member.type === "moderator"}
    <li class="moderator">
        {member.name}
        {#if !member.isActive}
            <span class="inactive-indicator" title="Inactive"></span>
        {/if}
    </li>
{:else}
    <li class={!member.isActive ? "inactive" : ""}>
        {member.name}
        <span class="team">({member.team.name})</span>
        {#if member.isSubbed}
            <span class="subbed-text">subbed out</span>
        {/if}
        {#if !member.isActive}
            <span class="inactive-indicator" title="Inactive"></span>
        {/if}
        {#if showControls}
            <div class="controls">
                <button
                    onclick={toggleSub}
                    title={member.isSubbed ? "Put in play" : "Sub out"}
                >
                    {member.isSubbed ? "In" : "Sub"}
                </button>
                <button onclick={promote}>
                    <Icon svg={badgeSvg} />
                </button>
                <button onclick={kick}>
                    <Icon svg={kickSvg} />
                </button>
                <button onclick={rename}>
                    <Icon svg={editNameSvg} />
                </button>
            </div>
        {/if}
    </li>
{/if}

<style lang="scss">
    @use "$styles/_global.scss" as *;

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

    .inactive {
        opacity: 0.6;
    }

    .inactive-indicator {
        display: inline-block;
        width: 8px;
        height: 8px;
        background-color: $red;
        border-radius: 50%;
        margin-left: 0.5em;
        flex-shrink: 0;
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
        min-width: 1.75em;
        cursor: pointer;
        border: none;
        background: transparent;
        padding: 0 0.25em;
        font-size: 0.9rem;
        border-radius: 0.25em;
        transition: all 0.2s;
        color: $gray-2;

        &:hover {
            background: rgba($primary, 0.1);
            color: $primary;
        }

        &:nth-child(3):hover {
            background: rgba($red, 0.1);
            color: $red;
        }
    }

    .subbed-text {
        color: $text-muted;
        font-style: italic;
        font-size: 0.8rem;
        margin-left: 0.5em;
    }
</style>
