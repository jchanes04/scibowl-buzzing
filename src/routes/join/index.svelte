<script lang="ts" context="module">
    export function load({ fetch }) {
        return {}
    }
</script>

<script lang="ts">
    import { session } from "$app/stores"

    function handleSubmit() {
        let name = (<HTMLInputElement>document.getElementById("name-input")).value
        $session.memberName = name 
    }

    function handleFormInput() {
        let name = (<HTMLInputElement>document.getElementById("name-input")).value;
        (<HTMLButtonElement>document.getElementById('join-game')).disabled = name === '' || joinCodeValue.length !== 5
    }

    import Controlled from '$lib/components/ControlledInput.svelte'
    let joinCodeValue: string
</script>

<form action={`/join`} method="POST" on:submit={handleSubmit} on:input={handleFormInput}>
    <h3>Enter a join code</h3>
    <div>
        <Controlled validateFunction={value => /^[A-Z0-9]{0,5}$/.test(value)} name="join-code" bind:value={joinCodeValue}/>
        <input type="text" placeholder="Your Name" name="name" id="name-input" />
        <button id="join-game" disabled>Join</button>
    </div>
</form>