<script lang="ts">
    import type { Member } from "$lib/mongo";
    export let player: Member

    let { firstName, lastName, discordUsername, grade } = player

    export function getMemberData() {
        return { firstName, lastName, discordUsername, grade }
    }
</script>

<div>
    <label for='firstName'>First Name</label><br />
    <input type='number' name='firstName' bind:value={firstName} /><br />
    <label for='lastName'>Last Name</label><br />
    <input type='number' name='lastName' bind:value={lastName} /><br />
    <label for='Discord' >Discord Username</label><br />
    <input type='text' bind:value={discordUsername} name='Discord' /><br />
    <label for='Grade'>Grade</label><br />
    <input type='text' name='Grade' bind:value={grade} /><br />
</div>