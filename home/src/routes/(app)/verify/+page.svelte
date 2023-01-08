<script lang="ts">
    import type { PageData } from "./$types"

    export let data: PageData
</script>

<main>
    {#if data.verified}
        <h1>Verification success</h1>
        <p>You have verified your email address and your school is now fully registered</p>
    {:else}
        <h1>Verificatin failed</h1>
        <p>You may have an invalid code, or some other error may have occurred. Please reach out to tournament organizers for another code.</p>
    {/if}
</main>

<style lang="scss">
    h1 {
        text-align: center;
    }

    p {
        max-width: 70ch;
        text-align: center;
        margin: auto;
    }
</style>