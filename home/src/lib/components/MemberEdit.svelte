<script lang="ts">
    import type { Member, Grade } from "$lib/mongo";
    import { createEventDispatcher } from "svelte";
    import Select from 'svelte-select'

    export let player: Member
    export let shown : boolean
    
    const dispatch = createEventDispatcher()

    const grades = [
        { id: 8, value: "8th and under" },
        { id: 9, value: "9th" },
        { id: 10, value: "10th" },
        { id: 11, value: "11th" },
        { id: 12, value: "12th" }
    ]

    let tempPlayer = player
    $: console.log(tempPlayer)
    $: updatePlayer(player)
    
    function updatePlayer(player: Member){
        tempPlayer = player
    }

    export function getMemberData() {
        return tempPlayer
    }

    function handleGradeSelect(e: CustomEvent<{ id: number, value: Grade}>) {
        tempPlayer.grade = e.detail.value
    }
</script>
{#if shown}
<form class="memberEdit" on:input={() => dispatch('change')}>
    <label for='firstName'>First Name</label><br />
    <input type='text' placeholder='John' name='firstName' bind:value={tempPlayer.firstName} autocomplete="off" /><br />
    <label for='lastName'>Last Name</label><br />
    <input type='text' placeholder='Doe' name='lastName' bind:value={tempPlayer.lastName} autocomplete="off" /><br />
    <label for='Discord' >Discord Tag</label><br />
    <input type='text' placeholder='JohntheDoe#1234' bind:value={tempPlayer.discordUsername} name='Discord' autocomplete="off" /><br />
    
    <label for='Grade'>Grade</label><br />
    <div class='select'>
    <Select items={grades} optionIdentifier="id" labelIdentifier="value" on:select={handleGradeSelect}
    value={grades.find(g => g.value === tempPlayer.grade) || null} />
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
        padding-top: 1em;
        padding-bottom: 1em;
        padding-left: 3em;
        
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
        font-size: 20pt;
        margin: 1em 0 .1em 0;
    }
</style>