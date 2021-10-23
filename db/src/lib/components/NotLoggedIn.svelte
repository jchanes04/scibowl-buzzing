<script lang="ts">
    import { HOST_URL } from "$lib/variables";
    export let page: "write" | "edit" | "question-search" | "account"
</script>

<div>
    <p>You are not logged in, log in to view this content</p>
    <a href={`https://discord.com/api/oauth2/authorize?client_id=895468421054083112&redirect_uri=http%3A%2F%2F${encodeURIComponent(HOST_URL)}%2Fauth%2F${page}&response_type=code&scope=identify`}>
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