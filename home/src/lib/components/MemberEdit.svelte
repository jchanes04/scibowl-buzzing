<script lang="ts">
    import type { Member, Grade } from "$lib/mongo";
    import { createEventDispatcher } from "svelte";
    import Select from 'svelte-select'
    import DiscordInput from "./DiscordInput.svelte";

    export let player: Member
    export let shown: boolean

    const dispatch = createEventDispatcher()

    const grades = ["8th and under", "9th", "10th", "11th", "12th"]
</script>
{#if shown}
    <form id="edit" on:change={() => dispatch('change')} autocomplete="off">
        <div class="memberEdit">
            <label for='firstName'>First Name</label><br />
            <input type='text' placeholder='John' name='firstName' bind:value={player.firstName} /><br />
            <label for='lastName'>Last Name</label><br />
            <input type='text' placeholder='Doe' name='lastName' bind:value={player.lastName} /><br />
            <label for='Discord' >Discord Tag</label><br />
            <DiscordInput bind:value={player.discordUsername} /><br />
            <input type="hidden" name="grade" value={player.grade} />
            
            <label for='Grade'>Grade</label><br />
            <div class='select'>
                <Select items={grades} name="grade" bind:value={player.grade} searchable={false} clearable={false} showChevron={true} on:change={() => dispatch('change')} />
            </div>
        </div>
    </form>
{/if}

<style lang="scss">
    input[type="text"] {
        padding: 0.3em;
        font-size: 20px;
        margin: 0.5em auto;
        border: none;
        border-radius: 0.3em;
        box-sizing: border-box;
        width: min(80%,300px);
        text-align: left;
        font-family: 'Ubuntu';
        position: relative;
        &:focus::placeholder {
            color: transparent;
        }
    }
    .memberEdit{
        text-align: left;
        border: solid 5px var(--color-3);
        box-sizing: border-box;
        border-radius: 0 15px 15px 15px;
        padding: 1em 3em;

        @media (max-width: 600px) {
            padding: 1em;
        }
    }

    .select {
        --input-font-size:20px;
        font-size: 20px;
        border: none;
        margin: .5em 0;
        --border-radius: .3em;
        box-sizing: border-box;
        max-width: min(300px,80%);
        position: relative;
        text-align: left;
        font-family: 'Ubuntu';
        &:focus::placeholder {
            color: transparent;
        }
    }
    
    label {
        font-size: 24px;
        margin: 0.5em 0 .1em 0;
        display: inline-block;
    }
</style>