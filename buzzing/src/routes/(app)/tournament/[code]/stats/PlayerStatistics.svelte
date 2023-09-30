<script lang="ts">
    import type { Stats } from "$lib/mongo";

    export let playerStats: Record<string, Stats>
    
    function round(num: number) {
        return Math.round((num + Number.EPSILON) * 100) / 100
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
</div>