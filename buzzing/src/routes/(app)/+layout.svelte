<script lang="ts">
    import Header from "$lib/components/Header.svelte";
    import { onMount } from "svelte";
    import { clearChatMessages } from "$lib/stores/chatMessages";

    onMount(() => {
        clearChatMessages();
    });
</script>

<Header />
<slot></slot>