<script lang="ts">
    import type { Team, UserClean } from "$lib/mongo"
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import MemberMenu from "../MemberMenu.svelte";
    import MemberInfo from "./MemberInfo.svelte";
    import EditField from "../EditField.svelte"
    import Confirm from "../Confirm.svelte"
    import { invalidateAll } from "$app/navigation";

    export let team: Team
    export let user: UserClean | undefined

    const modalStore: Writable<{
        component: ConstructorOfATypedSvelteComponent,
        props: Record<string, unknown>
    } | null> = getContext('modalStore')

    function handleRenameTeam() {
        $modalStore = {
            component: EditField,
            props: {
                headerText: "Rename Team",
                initialValue: team.name,
                actionName: "name",
                hiddenInputs: {
                    'team-id': team._id
                },
                cancelCallback: () => {
                    $modalStore = null
                },
                confirmCallback: (data: FormData) => {
                    const value = data.get('schoolName') as string
                    team.name = value
                    $modalStore = null
                }
            }
        }
    }

    function handleDeleteTeam() {
        $modalStore = {
            component: Confirm,
            props: {
                headerText: "Confirm Delete",
                message: `Are you sure you want to delete ${team.name}?`,
                cancelCallback: () => {
                    $modalStore = null
                },
                confirmCallback: async () => {
                    await fetch(`/api/team/${team._id}`, {
                        method: "DELETE"
                    })
                    invalidateAll()
                    $modalStore = null
                }
            }
        }
    }
</script>

<div class="team-info">
    <h2>
        {team.name}
        {#if team.paid}
            ✔️
        {/if}
    </h2>
    {#if user}
        <p>{user.schoolName}</p>
    {/if}
    <MemberMenu teamData={team} showNew={false} let:member>
        <MemberInfo {member} />
    </MemberMenu>
    <div class="buttons">
        <button on:click={handleRenameTeam}>Rename Team</button>
        <button on:click={handleDeleteTeam}>Delete Team</button>
    </div>
</div>

<style lang="scss">
    .team-info {
        padding: 1em 2em;
        border-radius: 15px;
        background-color: var(--color-5);
    }

    .buttons {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 1em;
    }

    button {
        padding: 0.5em;
        margin-left: 1em;
        color: #EEE;
        background: var(--color-2);
        border-radius: 0.3em;
        font-weight: bold;
        border: solid black 3px;
        font-size: 16px;
        cursor: pointer;
        
        &:disabled {
            border: solid var(--color-2) 3px;
            background: transparent;
            color: #444;
            cursor: default;
        }
    }
</style>