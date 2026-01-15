<script lang="ts">
    import Header from "$lib/components/Header.svelte";
    import { onMount } from "svelte";
    import chatMessagesStore from "$lib/stores/chatMessages.svelte";
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();

</script>

<Header />
{@render children?.()}