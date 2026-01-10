<!-- @migration-task Error while migrating Svelte code: `<tr>` cannot be a child of `<table>`. `<table>` only allows these children: `<caption>`, `<colgroup>`, `<tbody>`, `<thead>`, `<tfoot>`, `<style>`, `<script>`, `<template>`. The browser will 'repair' the HTML (by moving, removing, or inserting elements) which breaks Svelte's assumptions about the structure of your components.
https://svelte.dev/e/node_invalid_placement -->
<script lang="ts">
    import {
        convertStatsToCSV,
        type OptionalCategoryStats,
    } from "$lib/functions/statistics";

    interface Props {
        teamStats: Record<string, OptionalCategoryStats>;
        category: string;
    }
    let { teamStats, category }: Props = $props();

    function round(num: number) {
        return Math.round((num + Number.EPSILON) * 100) / 100;
    }

    async function exportStats() {
        const csv = await convertStatsToCSV(teamStats);
        const url = window.URL.createObjectURL(
            new Blob([csv], { type: "plain/text" }),
        );
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `teamStats${category}.csv`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
    }
</script>

<div>
    <table>
        <thead>
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
        </thead>
        <tbody>
            {#each Object.entries(teamStats) as [name, stats]}
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
        </tbody>
    </table>
    <button onclick={exportStats}>Export Stats</button>
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    button {
        @extend %button;

        font-size: 22px;
        margin: 0.25em;
    }
</style>
