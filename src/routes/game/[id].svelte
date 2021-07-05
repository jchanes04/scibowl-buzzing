<script context="module" lang="ts">
    export async function load({ page, fetch }: LoadInput) {

        let res = await fetch(`/api/game/${page.params.id}`)

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
    export let memberList: Member[]
    export let gameName: string
    export let gameID: string

    import MemberList from "$lib/components/MemberList.svelte";
    import type { LoadInput } from "@sveltejs/kit";
    import type { Member } from "$lib/classes/Member";
    import { io } from 'socket.io-client'
    import Cookie from 'js-cookie'
    import { writable } from 'svelte/store'

    const socket = writable(io("http://localhost:3030", {
        auth: {
            memberID: Cookie.get("memberID"),
            gameID
        } 
    }))

    $socket.onAny((event: string, ...args: any[]) => {
        console.log(event, args);
    })
</script>

<div>
    <h1>{gameName}</h1>
    <MemberList memberList={memberList} />
</div>