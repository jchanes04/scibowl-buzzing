<script lang="ts">
    import Header from "$lib/components/Header.svelte";
    import { onMount } from "svelte";
    import { clearChatMessages } from "$lib/stores/chatMessages";
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();

    onMount(() => {
        clearChatMessages();
    });
</script>

<Header />
{@render children?.()}