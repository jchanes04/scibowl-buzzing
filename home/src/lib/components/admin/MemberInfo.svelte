<script lang="ts">
    import type { Member } from "$lib/mongo";
    import { createEventDispatcher, getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import Confirm from "$lib/components/Confirm.svelte";

    export let member: Member

    const modalStore: Writable<{
        component: ConstructorOfATypedSvelteComponent,
        props: Record<string, unknown>
    } | null> = getContext('modalStore')

    const dispatch = createEventDispatcher()

    function removeMember() {
        $modalStore = {
            component: Confirm,
            props: {
                headerText: "Confirm Delete",
                message: `Are you sure you want to delete ${member.firstName} ${member.lastName} from the team?`,
                cancelCallback: () => {
                    $modalStore = null
                },
                confirmCallback: async () => {
                    $modalStore = null
                    dispatch('removeMember')
                }
            }
        }
    }
</script>

<div class="member-info">
    <div>
        <h3>Name:</h3>
        <p>{member.firstName} {member.lastName}</p>
        <h3>Discord Username:</h3>
        <p>{member.discordUsername}</p>
        <h3>Grade:</h3>
        <p>{member.grade}</p>
        <div class="button-wrapper">
            <button on:click={removeMember}>Remove Member</button>
        </div>
    </div>
</div>

<style lang='scss'>
    .member-info {
        text-align: left;
        border: solid 5px var(--color-3);
        box-sizing: border-box;
        border-radius: 0 15px 15px 15px;
        padding: 1em 3em;

        @media (max-width: 600px) {
            padding: 1em;
        }
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