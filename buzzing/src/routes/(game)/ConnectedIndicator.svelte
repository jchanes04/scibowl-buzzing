<script lang="ts">
    import { browser } from "$app/environment";
    import getSocket from "$lib/socket";
    import { onDestroy } from "svelte";

    const socket = getSocket()
    let connected = false
    $: displayText = connected ? "Connected" : "Disconnected"

    let interval: number | NodeJS.Timer = 0

    function pollForConnected() {
        clearInterval(interval)
        interval = setInterval(() => {
            if (socket.connected) {
                pollForDisconnected()
            }

            connected = socket.connected
        }, 50)
    }
 
    function pollForDisconnected() {
        clearInterval(interval)
        interval = setInterval(() => {
            if (!socket.connected) {
                pollForConnected()
            }

            connected = socket.connected
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
    @use '$styles/_global.scss' as *;

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
        background-color: $green;
    }

    .disconnected .circle {
        background-color: $red;
    }
</style>