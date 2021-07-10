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

<form action={`/join`} method="POST" on:input={handleFormInput}>
    <h3>Enter a join code</h3>
    <div>
        <Controlled validateFunction={value => /^[a-zA-Z0-9]{0,4}$/.test(value)} name="join-code" placeholderValue="Join Code" bind:value={joinCodeValue}/>
        <button id="join-game" disabled>Join</button>
    </div>
</form>