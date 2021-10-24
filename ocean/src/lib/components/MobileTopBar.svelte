<script lang="ts">
    export let joinCode: string

    let hWidth: number
    let windowWidth: number
</script>

<svelte:window bind:innerWidth={windowWidth} />

<div id="mobile-top-bar">
    <div>
        <h1>{joinCode}</h1>
        <slot></slot>
    </div>
</div>

<style lang="scss">
    #mobile-top-bar {
        grid-area: mobile-top-bar;
        position: fixed;
        padding: 0 0.5em;
        width: 100%;
        box-sizing: border-box;
        background: #d4d9d9;
        z-index: 5;

        > div {
            display: inline-flex;
            flex-direction: row;
            justify-content: space-between;
            width: 100%;

            * {
                display: grid;
                place-content: center;
            }
        }
    }

    h1 {
        display: inline-block;
        width: max-content;
    }
</style>