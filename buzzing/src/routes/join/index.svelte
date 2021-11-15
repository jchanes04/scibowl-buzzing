<script lang="ts" context="module">
    export function load({ fetch }) {
        return {}
    }
</script> 

<script lang="ts">
    function handleFormInput() {
        (<HTMLButtonElement>document.getElementById('join-game')).disabled = joinCodeValue.length !== 4
    }

    import Controlled from '$lib/components/ControlledInput.svelte'
    let joinCodeValue: string
</script>

<svelte:head>
    <title>Join Game</title>
</svelte:head>

<form action={`/join`} method="POST" on:input={handleFormInput} autocomplete="off">
    <h1>Enter a join code</h1>
    <div>
        <Controlled validateFunction={value => /^[a-zA-Z0-9]{0,4}$/.test(value)} name="join-code" placeholderValue="Join Code" bind:value={joinCodeValue}/>
            <br />
        <button id="join-game" disabled>Join</button>
    </div>
</form>

<style lang="scss">
    form {
        margin: 3em auto;
        border-radius: 1em;
        text-align: center;
        padding: 1em;
        position: relative;
    }

    h1 {
        font-size: 44px;
        text-decoration: underline var(--blue) 3px;
        text-underline-offset: 0.2em;
    }

    button {
        padding: 0.5em;
        color: #EEE;
        background: var(--green);
        border-radius: 0.3em;
        font-weight: bold;
        border: solid black 3px;
        font-size: 18px;
        cursor: pointer;
        width: 8ch;

        &:disabled {
            border: solid var(--green) 3px;
            background: transparent;
            color: #444;
            cursor: default;
        }
    }
</style>