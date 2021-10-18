<script lang="ts">
    import type { category } from "src/mongo";
    import type {SaQuestion, McqQuestion} from 'src/mongo'
    import { session } from '$app/stores'
    import { onMount } from 'svelte';
    import { page } from '$app/stores'
    import Cookie from 'js-cookie'
    import NotLoggedIn from "$lib/components/NotLoggedIn.svelte";
    import NotAuthorized from "$lib/components/NotAuthorized.svelte";
    import DatabaseHeader from "$lib/components/DatabaseHeader.svelte";
    import { HOST_URL } from "$lib/variables";
    import EditQuestion from "$lib/components/EditQuestion.svelte";

    let question = <McqQuestion | SaQuestion>{}

    onMount(async () => {
        let res = await fetch("/api/question/" + $page.params.id, {
            headers: {
                'Authorization': Cookie.get('authToken')
            }
        })
        question = <McqQuestion | SaQuestion>await res.json();     
    })


</script>

<svelte:head>
    <title>Edit Question</title>
</svelte:head>
<main>
    <DatabaseHeader>
        {#if $session.isLoggedIn}
            <h1 style="margin: 0;">{$session.userData?.username}</h1>
        {:else}
            <a href={`https://discord.com/api/oauth2/authorize?client_id=895468421054083112&redirect_uri=http%3A%2F%2F${encodeURIComponent(HOST_URL)}%2Fauth%2Fedit&response_type=code&scope=identify`}>
                <button>Login</button>
            </a>
        {/if}
    </DatabaseHeader>

    {#if !$session.isLoggedIn}
        <NotLoggedIn page="edit"/>
    {:else if $session.userID !== question.authorId}
        <NotAuthorized page="edit" />
    {:else}
        <div id="question-wrapper">
            <EditQuestion {question} />
        </div>
    {/if}
</main>

<style lang="scss">
    #question-wrapper {
        width: 100%;
        text-align: center;
    }

    h1 {
        font-size: 44px;
        text-decoration: underline var(--blue) 3px;
        text-underline-offset: 0.2em;
    }

    .radio-wrapper {
        text-align: left;
        display: inline-block;
    }

    select {
        margin: 1em auto 0.5em;
        font-size: 18px;
    }

    input[type="text"] {
        padding: 0.3em;
        font-size: 24px;
        margin: 0.5em auto;
        border: none;
        border-radius: 0.3em;
        box-sizing: border-box;
        width: 25ch;
        max-width: 80vw;
        text-align: center;
        font-family: 'Ubuntu';
        position: relative;

        &:focus::placeholder {
            color: transparent;
        }
    }

    textarea {
        padding: 0.3em;
        font-size: 20px;
        margin: 0.5em auto;
        border: none;
        border-radius: 0.3em;
        box-sizing: border-box;
        width: 40ch;
        max-width: 80vw;
        resize: vertical;
        min-height: 1.8em;
        height: 1.8em;
        font-family: 'Ubuntu';
        position: relative;
        vertical-align: middle;

        &:focus::placeholder {
            color: transparent;
        }
    }

    label {
        cursor: pointer;
        padding-top: 0.3em;
        padding-bottom: 0.3em;
        display: inline-block;
        font-size: 20px;
        vertical-align: middle;

        input[type="radio"] {
            visibility: hidden;
            width: 0;
            height: 0;
        }

        .choice {
            width: 40ch;
            height: 3em;
            min-height: 3em;
        }

        p {
            width: 2.5ch;
            margin: 0;
            display: inline-block;
        }

        span {
            width: 1em;
            height: 1em;
            border-radius: 50%;
            border: #CCC 2px solid;
            display: inline-block;
            position: relative;
            background: #FFF;
            vertical-align: text-top;
            margin-right: 0.3em;

            &::after {
                content: '';
                position: absolute;
                display: none;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 0.7em;
                height: 0.7em;
                border-radius: 0.35em;
                background: var(--blue);
            }
        }

        &:hover > span {
            border-color: var(--green);
        }

        input:checked ~ span::after {
            display: inline-block;
        }
    }

    button {
        padding: 0.5em;
        color: var(--color-3);
        background: var(--green);
        border-radius: 0.3em;
        font-weight: bold;
        border: solid black 3px;
        font-size: 18px;
        cursor: pointer;
        margin-top: 1em;

        &:disabled {
            padding: calc(0.5em - 3px);
            border: solid var(--green) 3px;
            background: transparent;
            color: #444;
            cursor: default;
        }
    }
</style>