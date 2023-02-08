<script lang="ts">
    import User from "$lib/components/admin/User.svelte";
    import { writable, type Writable } from "svelte/store";
    import { setContext } from "svelte";
    import type { PageData } from "./$types";

    const modalStore: Writable<{
        component: ConstructorOfATypedSvelteComponent,
        props: Record<string, unknown>
    } | null> = writable(null)
    setContext('modalStore', modalStore)

    export let data: PageData
    $: ({ users, teams } = data)
</script>

<main>
    <h1>{users.length - 1} Users</h1>
    <div class="users">
        {#each users.filter(u => !u.admin) as u}
            <User bind:user={u} teams={teams.filter(t => t.userId === u._id)} />
        {/each}
    </div>
    {#if $modalStore}
        <div class="modal-wrapper">
            <div class="modal">
                <svelte:component this={$modalStore.component} {...$modalStore.props} />
            </div>
        </div>
    {/if}
</main>

<style lang="scss">
    main {
        position: relative;
        padding: 1em;
    }

    h1 {
        text-align: center;
    }

    .users {
        display: flex;
        flex-direction: column;
        gap: 1em;
        margin: 1em auto;
        padding: 3em;
        max-width: 800px;
    }

    .modal-wrapper {
        position: fixed;
        inset: 0;
        background: rgba(64, 64, 64, 0.5);
    }

    .modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
</style>