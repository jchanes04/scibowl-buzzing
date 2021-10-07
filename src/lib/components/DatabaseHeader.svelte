<script lang="ts">

</script>

<div id="header">
    <h1>Enloe Scibowl Question Database</h1>
    <div id="login">
        <a href="https://discord.com/api/oauth2/authorize?client_id=895468421054083112&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth&response_type=code&scope=identify">
            <button>Login</button>
        </a>
    </div>
</div>

<style lang="scss">
    h1 {
        display: inline-block;
    }
    
    #login {
        float: right;
    }

    button {
        color: #EEE;
        background: var(--green);
        margin: 1em;
        font-size: 20px;
        font-weight: bold;
        padding: 0.6em;
        border-radius: 0.6em;
        border: solid black 3px;
        cursor: pointer;
    }
</style>