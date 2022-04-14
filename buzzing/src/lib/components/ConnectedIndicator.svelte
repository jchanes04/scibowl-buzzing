<script lang="ts">
    import { browser } from "$app/env";
    import socketStore from "$lib/stores/socket";
    import { onDestroy } from "svelte";

    let connected = false
    $: displayText = connected ? "Connected" : "Disconnected"

    let interval = null

    function pollForConnected() {
        clearInterval(interval)
        interval = setInterval(() => {
            if ($socketStore.connected) {
                pollForDisconnected()
            }

            connected = $socketStore.connected
        }, 50)
    }
 
    function pollForDisconnected() {
        clearInterval(interval)
        interval = setInterval(() => {
            if (!$socketStore.connected) {
                pollForConnected()
            }

            connected = $socketStore.connected
        }, 2500)
    }

    if (browser) pollForConnected()

    onDestroy(() => {
        clearInterval(interval)
    })
</script>

<div class="indicator" class:connected class:disconnected={!connected}>
    <span class="circle" />
    <p>{displayText}</p>
</div>

<style lang="scss">
    .indicator {
        position: fixed;
        left: 10px;
        bottom: 10px;
    }

    .circle {
        display: inline-block;
        height: 1em;
        width: 1em;
        border-radius: 50%;
    }

    p {
        display: inline-block;
    }

    .connected .circle {
        background-color: var(--green);
    }

    .disconnected .circle {
        background-color: var(--red);
    }
</style>