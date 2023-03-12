<script lang="ts">
    
</script>

<div id="header">
    <a href="/" class="title-anchor"><h1 id="title">ESBOT</h1></a>
    <div id="right">
        <nav>
            <a href="/admin/users">Users</a>
            <a href="/admin/teams">Teams</a>
            <a href="/admin/discord">Discord Usernames</a>
            <form action="/?/logout" method="POST">
                <button class="login" type="submit">Logout</button>
            </form>
        </nav>
    </div>
</div>

<style lang="scss">
    #header {
        background: var(--color-5);
        position: sticky;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 5;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }
    
    h1 {
        display: inline-block;
        margin-left: 0.75em;
        margin-top: 0.75em;
    }
    
    #right {
        margin: 0.5em 1em 0.5em 0;
        display: inline-flex;
        flex-direction: row;
        align-items: center;
        font-size: 32px;
        width: min-content;
        float: right;

        @media (max-width: 650px) {
            width: 100%;
            justify-content: center;
            font-size: 24px;
        }
    }

    nav {
        display: flex;
        flex-direction: row;
        gap: 1em;

        a {
            text-decoration: none;
            color: inherit;
            transition: color 0.3s;
            cursor: pointer;
            white-space: nowrap;

            &:hover {
                color: var(--color-2)
            }
        }

        button {
            background: none;
            border: none;
            text-decoration: none;
            color: inherit;
            transition: color 0.3s;
            cursor: pointer;
            white-space: nowrap;
            font-size: inherit;

            &:hover {
                color: var(--color-2)
            }
        }
    }

    .title-anchor {
        @media (max-width: 650px) {
            display: none;
        }
        color: black;
        transition: color 0.3s;
        &:hover {
            color: var(--color-2)
        }
    }
</style>