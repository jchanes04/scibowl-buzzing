<script lang="ts">
    import { convertStatsToCSV, type OptionalCategoryStats } from "$lib/functions/statistics";

    export let playerStats: Record<string, OptionalCategoryStats>
    export let category: string
    
    function round(num: number) {
        return Math.round((num + Number.EPSILON) * 100) / 100
    }

    async function exportStats() {
        const csv = await convertStatsToCSV(playerStats)
        const url = window.URL.createObjectURL(new Blob([csv], { type: "plain/text" }))
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `playerStats${category}.csv`
        document.body.appendChild(a)
        a.click()
        URL.revokeObjectURL(url)
    }
</script>

<div>
    <table>
        <tr></tr>
        <tr>
            <th></th>
            <th>GP</th>
            <th>TUH</th>
            <th>Buzzes</th>
            <th>PPG</th>
            <th>NPG</th>
            <th>BPG</th>
            <th>Acc.</th>
        </tr>
        {#each Object.entries(playerStats) as [name, stats]}
            <tr>
                <td>{name}</td>
                <td>{stats.gamesPlayed}</td>
                <td>{stats.tuh}</td>
                <td>{stats.buzzes}</td>
                <td>{round(stats.ppg)}</td>
                <td>{round(stats.npg)}</td>
                <td>{round(stats.bpg)}</td>
                <td>{Math.round(stats.accuracy * 1000) / 10}%</td>
            </tr>
        {/each}
    </table>
    <button on:click={exportStats}>Export Stats</button>
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    button {
        @extend %button;

        font-size: 22px;
        margin: 0.25em;
    }
</style>