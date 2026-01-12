<script lang="ts">
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import Confirm from "$lib/components/Confirm.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import kickSvg from "$lib/icons/kick.svg?raw";
    import badgeSvg from "$lib/icons/badge.svg?raw";
    import editNameSvg from "$lib/icons/edit-name.svg?raw";
    import TextField from "$lib/components/TextField.svelte";
    import type { ClientModeratorData } from "$lib/classes/client/ClientModerator";
    import type { ClientPlayerData } from "$lib/classes/client/ClientPlayer";
    import type { ClientTeamData } from "$lib/classes/client/ClientTeam";
    import { useQuery } from "convex-svelte";
    import { api } from "../../../convex/_generated/api";
    import { convex } from "$lib/convexClient";
    import { page } from "$app/state";

    const rawTeams = useQuery(api.teams.getByGameId, { gameId : page.params.id ?? "" });
    const teams : ClientTeamData[] = $derived(
        (rawTeams.data ?? []).map(team => ({
            id: team.externalId,
            name: team.name,
            type: team.type
        }))
    );

    interface Props {
        member: ClientModeratorData | ClientPlayerData;
        showControls?: boolean;
    }

    let { member, showControls = false }: Props = $props();

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
                confirmCallback: () => {
                    // Call Convex directly
                    const gameId = page.params.id;
                    if (gameId) {
                        convex.mutation(api.players.promoteToModerator, {
                            gameId: gameId as any,
                            playerId: member.id
                        }).catch(console.error);
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
                confirmCallback: () => {
                    // Call Convex directly
                    const gameId = page.params.id;
                    if (gameId) {
                        convex.mutation(api.games.kickPlayer, {
                            gameId: gameId as any,
                            externalId: member.id
                        }).catch(console.error);
                    }
                    $modalStore = null;
                },
            },
        };
    }

    function rename() {
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
                confirmCallback: (value: string) => {
                    // Call Convex directly
                    const gameId = page.params.id;
                    if (gameId) {
                        convex.mutation(api.players.rename, {
                            gameId: gameId,
                            externalId: member.id,
                            name: value
                        }).catch(console.error);
                    }
                    $modalStore = null;
                },
            },
        };
    }
</script>

{#if member.type === "moderator"}
    <li class="moderator">
        {member.name}
        {#if !member.connected}
            <span class="disconnected-indicator" title="Disconnected"></span>
        {/if}
    </li>
{:else}
    <li>
        {member.name}
        {#if !member.connected}
            <span class="disconnected-indicator" title="Disconnected"></span>
        {/if}
        {#if member.team}
            <span class="team">({teams.find(team => team.id === member.team)?.name})</span>
        {/if}
        {#if showControls}
            <div class="controls">
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

        .disconnected-indicator {
            display: inline-block;
            height: 0.6em;
            width: 0.6em;
            border-radius: 50%;
            background-color: $red;
            margin-left: 0.5em;
            flex-shrink: 0;
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
