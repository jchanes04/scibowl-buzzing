<script lang="ts">
    import type { Member, Grade } from "$lib/mongo";
    import Select from 'svelte-select'

    export let player: Member
    export let shown : boolean
    
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
<div class="memberEdit">
        <label for='firstName'>First Name</label><br />
        <input type='text' name='firstName' bind:value={tempPlayer.firstName} /><br />
        <label for='lastName'>Last Name</label><br />
        <input type='text' name='lastName' bind:value={tempPlayer.lastName} /><br />
        <label for='Discord' >Discord Username</label><br />
        <input type='text' bind:value={tempPlayer.discordUsername} name='Discord' /><br />
        
        <label for='Grade'>Grade</label><br />
        <div class='select'>
        <Select items={grades} optionIdentifier="id" labelIdentifier="value" on:select={handleGradeSelect}
        value={grades.find(g => g.value === tempPlayer.grade) || null} />
        </div>
</div>
{/if}

<style lang="scss">
    input[type="text"] {
        padding: 0.3em;
        font-size: 20px;
        margin: 0.5em auto;
        border: none;
        border-radius: 0.3em;
        box-sizing: border-box;
        max-width: 80%;
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
        padding: 3em;
    }
    .select {
        --input-font-size:20px;
        font-size: 20px;
        border: none;
        margin: .5em 0;
        --border-radius: .3em;
        box-sizing: border-box;
        max-width: 21.6%;
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