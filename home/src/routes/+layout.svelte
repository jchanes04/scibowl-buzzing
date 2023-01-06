<script lang="ts">
    import { userStore } from "$lib/stores/user";
    import type { LayoutServerData } from "./$types";

    export let data: LayoutServerData

    const { user } = data
    $userStore = user
</script>

<slot></slot>