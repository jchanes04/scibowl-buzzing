 <script lang="ts">
    import Controlled from '$lib/components/ControlledInput.svelte'

    let codeExists = false

    async function handleFormInput() {
        if (joinCodeValue.length === 4) {
            const res = await fetch('/api/code-exists?code=' + joinCodeValue)
            const response = await res.json()
            codeExists = response.exists
        }
    }

    let joinCodeValue: string = ""
</script>

<svelte:head>
    <title>Join Game</title>
</svelte:head>

<form method="POST" on:input={handleFormInput} autocomplete="off">
    <h1>Enter a join code</h1>
    <Controlled validateFunction={value => /^[a-zA-Z0-9]{0,4}$/.test(value)} name="join-code" placeholderValue="Join Code" bind:value={joinCodeValue}/>
    <br />
    {#if !codeExists && joinCodeValue?.length === 4}
        <p class="error">Invalid code</p>
    {/if}
    <button id="join-game" disabled={codeExists || joinCodeValue.length !== 4}>Join</button>
</form>

<style lang="scss">
    form {
        margin: 0em auto;
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

    .error {
        color: red;
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