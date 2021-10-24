<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    let time = 3
    onMount(() => {
        setInterval(() => {
            time -= 1
            if (time===0){
                goto('/write')
            }
        }, 1000)
    })
</script>

<svelte:head>
    <title>Question Submitted</title>
</svelte:head>

<div>
    <h1>Sucessful Submission!</h1>
    <h1>You will be redirected in {time} seconds</h1>    
</div>

<style lang="scss">
    h1 {
        font-size: 44px;
        text-align: center;
        color: #33bb33;
    }

</style>