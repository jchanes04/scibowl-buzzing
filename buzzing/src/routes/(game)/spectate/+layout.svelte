<script lang="ts">
    import ConnectedIndicator from '$lib/components/ConnectedIndicator.svelte';
    import HeaderCompact from '$lib/components/HeaderCompact.svelte'
    import { setContext } from 'svelte';
    import { writable } from 'svelte/store';

    const modalStore = writable<{
        component: ConstructorOfATypedSvelteComponent,
        props: Record<string, unknown>
    } | null>(null)
    setContext('modalStore', modalStore)
</script>

<div id="page">
    <HeaderCompact />
    <slot></slot>
    <ConnectedIndicator />
</div>
{#if $modalStore}
    <svelte:component this={$modalStore.component} {...$modalStore.props} />
    <div class="modal-background" />
{/if}

<style lang="scss">
    #page {
        display: grid;
        grid-template-rows: auto 1fr;
        grid-template-columns: 1fr;
        height: calc(100vh - 1em);
        width: 100%;
        margin-bottom: 1em;

        @media (max-width: 800px) {
            height: none;
            min-height: 130vh;
            margin-bottom: 3em;
        }
    }

    .modal-background {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: 100vw;
        background-color: rgba(0, 0, 0, 0.3);
    }
</style>