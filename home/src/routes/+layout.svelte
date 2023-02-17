<script lang="ts">
    import { userStore } from "$lib/stores/user";
    import type { LayoutServerData } from "./$types";

    export let data: LayoutServerData

    $: $userStore = data.user
</script>

<slot></slot>