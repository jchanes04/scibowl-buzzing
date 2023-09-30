<script lang="ts">
    export let names: {
        item: string,
        score: number
    }[]
    export let original: string

    export let confirmCallback: (alias: string | null) => void

    let alias: string | null | undefined = undefined

    function confirm() {
        if (alias !== undefined) {
            confirmCallback(alias)
        }
    }
</script>

<div class="modal">
    <h2>Team Name Alias</h2>
    <p>Original name: <b>{original}</b></p>

    <ul>
        {#each names as name}
            <li>
                <input type="radio" name="team-alias" value={name.item} bind:group={alias} />
                {name.item}
                <span class="score">({name.score})</span>
            </li>
        {/each}
        <li>
            <input type="radio" name="team-alias" value={null} bind:group={alias} />
            <input type="hidden" name="no-alias" value={alias === null ? "true" : "false"} />
            <b>No alias</b>
        </li>
    </ul>

    <button on:click={confirm} disabled={alias === undefined}>Confirm selection</button>
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    .modal {
        background: $background-2;
        border-radius: 15px;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 2em;
    }

    button {
        @extend %button;
        
        font-size: 20px;
        padding: 0.6em;
        border-radius: 0.6em;
    }
</style>