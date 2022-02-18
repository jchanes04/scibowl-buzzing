<script context="module">
    import type { LoadInput } from '@sveltejs/kit'

    export async function load({ session, fetch }: LoadInput) {
        const teamsRes = session.userData.teamIds.map(t => await fetch())
    }
</script>

<script lang="ts">
    let selectedTeam = null
</>

<main>
    
</main>