<script lang="ts">
    import Header from "$lib/components/Header.svelte";
    import { userStore } from "$lib/stores/user";
    import { setContext } from "svelte";
    import { writable, type Writable } from "svelte/store";

    const modalStore: Writable<{
        component: ConstructorOfATypedSvelteComponent,
        props: Record<string, unknown>
    } | null> = writable(null)
    setContext('modalStore', modalStore)
</script>

{#if $modalStore}
    <div class="modal-backdrop">
        <div>
            <svelte:component this={$modalStore.component} {...$modalStore.props} />
        </div>
    </div>
{/if}
<slot></slot>

<style lang="scss">
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(32, 32, 32, 0.3);
        z-index: 5;

        > * {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
    }
</style>