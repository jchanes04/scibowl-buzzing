<script lang="ts">
    import { enhance } from "$app/forms";
    import Select from "svelte-select/Select.svelte";
    import type { PageData } from "./$types"
    import PlayerStatistics from "./PlayerStatistics.svelte";
    import TeamStatistics from "./TeamStatistics.svelte";
   
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import type { Category } from "$lib/classes/Game";

    export let data: PageData
    let { stats, code } = data
    $: ({ stats, code } = data)

    type ModalStore = Writable<{
        component: ConstructorOfATypedSvelteComponent,
        props: Record<string, unknown>
    } | null>
    const modalStore: ModalStore = getContext('modalStore')

    const categoryMappings: Record<string, string> = {
        "Overall": "Overall",
        "Biology": "bio",
        "Earth and Space": "earth",
        "Chemistry": "chem",
        "Physics": "physics",
        "Math": "math",
        "Energy": "energy"
    }
    let selectedCategory: string = "Overall"
    let selectedStatsType: "Team Stats" | "Player Stats" = "Team Stats"

    function pickSelectedStats(category: string, type: "Team Stats" | "Player Stats") {
        const s = type === "Team Stats" ? stats!.teamStats : stats!.playerStats
        return category === "Overall"
            ? s
            : Object.fromEntries(
                Object.entries(s).map(([name, val]) => {
                    const cat = categoryMappings[category] as Category
                    return [name, {
                        ...val.categories[cat],
                        gamesPlayed: val.gamesPlayed
                    }]
                })
            )
    }
    $: selectedStats = pickSelectedStats(selectedCategory, selectedStatsType)
</script>

<main>
    {#if stats}
        <div class="menu">
            <Select items={Object.keys(categoryMappings)} value={{ label: "Overall", value: "Overall" }}
                bind:justValue={selectedCategory} showChevron clearable={false} />
            <Select items={["Team Stats", "Player Stats"]} value={{ label: "Team Stats", value: "Team Stats" }}
                bind:justValue={selectedStatsType} showChevron clearable={false} />
        </div>
        {#if selectedStatsType === "Team Stats"}
            <TeamStatistics teamStats={selectedStats} category={selectedCategory} />
        {:else}
            <PlayerStatistics playerStats={selectedStats} category={selectedCategory} />
        {/if}
    {:else}
        <p>Statistics have not been calculated for this tournament yet.</p>
    {/if}
    <form method="POST" action="?/calculate" use:enhance>
        <button type="submit">Calculate Statistics</button>
    </form>
</main>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    .menu {
        display: flex;
        flex-direction: row;
        gap: 1em;
        margin-left: auto;
    }

    button {
        @extend %button;

        font-size: 22px;
        margin: 0.25em;
    }
</style>