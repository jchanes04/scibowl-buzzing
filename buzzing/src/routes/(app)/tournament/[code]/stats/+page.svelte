<script lang="ts">
    import { enhance } from "$app/forms";
    import Select from "svelte-select/Select.svelte";
    import type { PageData } from "./$types"
    import PlayerStatistics from "./PlayerStatistics.svelte";
    import TeamStatistics from "./TeamStatistics.svelte";
   
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";

    export let data: PageData
    let { stats, code } = data
    $: ({ stats, code } = data)

    type ModalStore = Writable<{
        component: ConstructorOfATypedSvelteComponent,
        props: Record<string, unknown>
    } | null>
    const modalStore: ModalStore = getContext('modalStore')

    const categoryChoices = [
        "Overall",
        "Biology",
        "Earth and Space",
        "Chemistry",
        "Physics",
        "Math",
        "Energy"
    ]
    let selectedCategory: string = "Overall"
    let selectedStats: string = "Team Stats"
</script>

<main>
    {#if stats}
        <div class="menu">
            <Select items={categoryChoices} bind:justValue={selectedCategory}
                showChevron clearable={false} />
            <Select items={["Team Stats", "Player Stats"]} bind:justValue={selectedStats}
                showChevron clearable={false} />
        </div>
        {#if selectedStats === "Team Stats"}
            <TeamStatistics teamStats={stats.teamStats} />
        {:else}
            <PlayerStatistics playerStats={stats.playerStats} />
        {/if}
    {:else}
        <p>Statistics have not been calculated for this tournament yet.</p>
    {/if}
    <form method="POST" action="?/calculate" use:enhance>
        <button type="submit">Calculate Statistics</button>
    </form>
</main>

<style lang="scss">
    .menu {
        display: flex;
        flex-direction: row;
        gap: 1em;
        margin-left: auto;
    }
</style>