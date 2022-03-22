<script lang="ts">
    import modalStore from "$lib/stores/modal";    
</script>

<div class="modal">
    <h1>{$modalStore.title}</h1>
    <p>{$modalStore.message}</p>
    
    <div class="buttons" style="margin-top: auto;">
        {#each $modalStore.options as opt}
            <button on:click={opt.callback}>{opt.text}</button>
        {/each}
    </div>
</div>

<style lang="scss">
    h1{
        font-size: 36px;
    }
    p {
        margin: 0em;
    }
    .modal {
        padding: 2em;
        z-index: 999;
        text-align: center;
        position: fixed;
        display: flex;
        flex-direction: column;
        top:50%;
        left: 50%;
        transform: translate(-50%,-50%);
        min-height:12em;
        width: min(500px, 80vw);
        border: .2em solid black;
        border-radius: 1em;
        background-color: #d4d9d9;
    }
    
    button {
        display: inline-block;
        padding: 0.5em;
        margin: .5em;
        color: black;
        background: var(--green);
        border-radius: 0.3em;
        font-weight: bold;
        border: solid black 3px;
        font-size: 18px;
        cursor: pointer;
        width: 15ch;

        &:disabled {
            border: solid var(--color-2) 3px;
            background: transparent;
            color: #444;
            cursor: default;
        }
    }

</style>
