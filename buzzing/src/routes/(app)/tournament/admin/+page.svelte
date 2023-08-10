<script lang="ts">
    import { enhance } from "$app/forms";
    import { invalidateAll } from "$app/navigation";
    import type { ActionData, PageData } from "./$types"

    export let data: PageData
    export let form: ActionData
    let { tournaments } = data
    $: ({ tournaments } = data)

    let newTournamentName = ""

    function clearForm() {
        form = null
    }
</script>

<main>
    <div class="tournaments">
        {#each tournaments as t}
            <div>
                <a href="/tournament/{t.code}">{t.name}</a>
                <br />
                <span class="tournament-code">{t.code}</span>
                <br />
                <span>{t.gameIds.length} games</span>
            </div>
        {/each}
    </div>
    <div class="create-tournament">
        {#if form}
            <h1>Tournament Created</h1>
            <p><span style:font-weight="bold">Code:</span> {form.code}</p>
            <p><span style:font-weight="bold">Password:</span> {form.password}</p>
            <button on:click={clearForm}>Close</button>
        {:else}
            <h1>New Tournament</h1>
            <form method="POST" use:enhance={() => {
                return ({ update }) => {
                    invalidateAll()
                    update()
                }
            }}>
                <input type="text" placeholder="Name" name="tournament-name" bind:value={newTournamentName} />
                <br />
                <button type="submit">Create</button>
            </form>
        {/if}
    </div>
</main>

<svelte:head>
    <title>Tournament Admin</title>
</svelte:head>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    main {
        display: grid;
        grid-template-columns: 300px 1fr;
    }

    .tournaments {
        display: flex;
        flex-direction: column;
        gap: 1em;
        height: max(70vh, 400px);
        overflow: auto;

        div {
            padding: 1em;
        }
    }

    .create-tournament {
        text-align: center;
    }

    h1 {
        font-size: 44px;
        text-decoration: underline $blue 3px;
        text-underline-offset: 0.2em;
        text-align: center;
    }

    input {
        @extend %text-input;

        font-size: 24px;
        margin: 0.5em auto;
        width: 25ch;
        max-width: 80vw;
        text-align: center;
    }

    button {
        @extend %button;

        font-size: 18px;
    }
</style>