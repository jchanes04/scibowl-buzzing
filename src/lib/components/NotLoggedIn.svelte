<script lang="ts"> 
</script>

<div>
    There has either been an error with your request or you are not logged in
    <a href="https://discord.com/api/oauth2/authorize?client_id=895468421054083112&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth&response_type=code&scope=identify">
        <button>Login</button>
    </a>
</div>

<style lang="scss">
    div {
        font-size: 44px;
        font-family: 'Ubuntu';
    }

    button {
        color: #EEE;
        background: var(--green);
        font-size: 44px;
        font-weight: bold;
        padding: 0.6em;
        border-radius: 0.6em;
        border: solid black 3px;
        cursor: pointer;
    }
</style>