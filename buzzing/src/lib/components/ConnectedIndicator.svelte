<script lang="ts">
    import socketStore from "$lib/stores/socket";

    let connected = false
    $: displayText = connected ? "Connected" : "Disconnected"

    setInterval(() => {
        connected = $socketStore.connected
    }, 5000)
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