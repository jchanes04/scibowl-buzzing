<script lang="ts">
    export let gameName: string
    export let joinCode: string

    $: console.log(gameName)

    let hWidth: number
    let windowWidth: number
</script>

<svelte:window bind:innerWidth={windowWidth} />

<div id="top-bar">
    <div>
        <h1 class="game-name">{gameName}</h1>
    </div>
    <div>
        <h1 class="join-code">{joinCode}</h1>
    </div>
    <div>
        <slot></slot>
    </div>
</div>

<style lang="scss">
    #top-bar {
        grid-area: top-bar;
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        padding: 0 2em;
        place-content: center;
        position: sticky;
        top: -0.5em;
        left: 0;
        background-color: #d4d9d9;

        * {
            min-width: 1px;
        }
    }

    h1 {
        display: inline-block;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        font-size: 24px;
    }

    .join-code {
        margin: 0    1em;
        font-size: 32px;
    }
</style>