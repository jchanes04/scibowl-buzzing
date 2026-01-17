<script lang="ts">
    import getSocket from "$lib/socket.svelte";
    import type {
        ClientModerator,
        ClientPlayer,
    } from "$lib/stores/members.svelte";
    import Confirm from "$lib/components/Confirm.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import kickSvg from "$lib/icons/kick.svg?raw";
    import badgeSvg from "$lib/icons/badge.svg?raw";
    import editNameSvg from "$lib/icons/edit-name.svg?raw";
    import { useConvexClient } from "convex-svelte";
    import { api } from "../../../convex/_generated/api";
    import gameIdStore from "$lib/stores/gameId.svelte";
    import { modalStore } from "$lib/stores/modal.svelte";

    interface Props {
        member: ClientPlayer | ClientModerator;
        showControls?: boolean;
    }

    let { member, showControls = false }: Props = $props();

    const socket = getSocket();
    const convex = useConvexClient();
    let newName = $state("");

    function promote() {
        modalStore.show({
            title: "Promote " + member.name,
            message:
                "Are you sure you want to promote " +
                member.name +
                " to moderator?",
            cancelCallback: () => modalStore.hide(),
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

                modalStore.hide();
            },
        });
    }

    function kick() {
        modalStore.show({
            title: "Kick " + member.name,
            message: "Are you sure you want to kick " + member.name + "?",
            cancelCallback: () => modalStore.hide(),
            confirmCallback: async () => {
                const gId = gameIdStore.value;
                if (gId) {
                    socket.emit("kickPlayer", member.id);
                    socket.emit("addChatMessage", {
                        type: "notification",
                        text: `${member.name} has been kicked`,
                    });
                }

                modalStore.hide();
            },
        });
    }

    function rename() {
        newName = member.name;
        modalStore.show({
            title: "Rename Player",
            message: renameMessage,
            cancelCallback: () => modalStore.hide(),
            confirmCallback: async () => {
                const gId = gameIdStore.value;
                if (gId) {
                    await convex.mutation(api.gameMembers.rename, {
                        gameId: gId,
                        memberId: member.id,
                        name: newName,
                    });
                }
                modalStore.hide();
            },
        });
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

{#snippet renameMessage()}
    <p class="modal-message-text">Change player name "{member.name}" to :</p>
    <!-- svelte-ignore a11y_autofocus -->
    <input
        type="text"
        class="modal-input"
        bind:value={newName}
        placeholder="New name"
        autofocus
        onkeydown={(e) =>
            e.key === "Enter" &&
            newName.trim() !== "" &&
            (async () => {
                const gId = gameIdStore.value;
                if (gId) {
                    await convex.mutation(api.gameMembers.rename, {
                        gameId: gId,
                        memberId: member.id,
                        name: newName,
                    });
                }
                modalStore.hide();
            })()}
    />
{/snippet}

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
