<script lang="ts">
    import Team from "$lib/components/admin/Team.svelte";
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
    <h1>{teams.length} Teams</h1>
    <div class="teams">
        {#each teams as team}
            <Team bind:team user={users.find(x => x._id === team.userId)} />
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

    .teams {
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