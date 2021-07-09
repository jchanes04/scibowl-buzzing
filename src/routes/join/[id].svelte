<script lang="ts" context="module">
    import type { LoadInput } from "@sveltejs/kit";


    export async function load({ page, fetch }: LoadInput) {

        let res = await fetch(`/api/join/${page.params.id}`)

        if (res.ok) {
            let json = await res.json()
            return {
                props: {
                    ...json,
                    gameID: page.params.id
                }
            }
        }

        return {}
    }
</script>

<script lang="ts">
    export let memberNames: string[], gameName: string, gameID: string

    import { session } from "$app/stores"
    
    import JoinMemberList from '$lib/components/JoinMemberList.svelte'

    function handleSubmit() {
        let name = (<HTMLInputElement>document.getElementById("name-input")).value
        $session.memberName = name
    }

    function handleFormInput() {
        let name = (<HTMLInputElement>document.getElementById("name-input")).value;
        (<HTMLButtonElement>document.getElementById('join-game')).disabled = name === ''
    }
</script>

<div>
    <form action={`/join`} method="POST" on:submit={handleSubmit} on:input={handleFormInput} autocomplete="off">
        <h3>Join {gameName}</h3>
        <div>
            <input type="hidden" name="gameID" value={gameID} />
            <input type="text" placeholder="Your Name" name="name" id="name-input" />
            <button id="join-game" disabled>Join</button>
        </div>
        <JoinMemberList memberNames={memberNames} />
    </form>
</div>

