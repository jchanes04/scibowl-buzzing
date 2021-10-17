<script lang="ts"> 
    export let page: "write" | "edit" | "question-search"
</script>

<div>
    <p>There has either been an error with your request or you are not logged in</p>
    <a href={`https://discord.com/api/oauth2/authorize?client_id=895468421054083112&redirect_uri=http%3A%2F%2F${encodeURIComponent(import.meta.env.VITE_HOST_URL)}%2Fauth%2F${page}&response_type=code&scope=identify`}>
        <button>Login</button>
    </a>
</div>

<style lang="scss">
    div {
        text-align: center;
    }

    p {
        font-size: 36px;
        font-family: 'Ubuntu';
    }

    button {
        color: #EEE;
        background: var(--green);
        font-size: 30px;
        font-weight: bold;
        padding: 0.6em;
        border-radius: 0.6em;
        border: solid black 3px;
        cursor: pointer;
        width: 12ch;
    }
</style>