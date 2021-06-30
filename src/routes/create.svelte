<script lang="ts">
    let id = "false"
    function handleSubmit() {
        let name = (<HTMLInputElement>document.getElementById("username-input")).value
        window.localStorage.setItem('name', name)
    }
</script>

<form action="/create" method="POST" autocomplete="off" on:submit={handleSubmit}>
    <h3>Create a new game</h3>
    {#if id}
        <input type="hidden" name="id" value={id} />
    {/if}
    <input type="text" placeholder="Game Name" name="game-name" id="game-name-input" />
    <br />
    <input type="text" placeholder="Your Name" name="owner-name" id="owner-name-input" />
    <br />
    <input type="checkbox" id="private-input" name="private-game" />
    <label for="private-input">Private game (users cannot join until game is made public)</label>
    <br />
    <button id="create-game" disabled>Create Game</button>
</form>