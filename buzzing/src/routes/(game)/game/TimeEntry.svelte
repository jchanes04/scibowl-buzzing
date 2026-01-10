<script lang="ts">
    import { tick } from "svelte";

    interface Props {
        value?: number;
    }

    let { value = $bindable(0) }: Props = $props();
    let minutesString = $derived(
        Math.floor(value / 60)
            .toString()
            .padStart(2, "0"),
    );
    let secondsString = $derived((value % 60).toString().padStart(2, "0"));
    let minutes = $derived(Number(minutesString) || 0);
    let seconds = $derived(Number(secondsString) || 0);

    function updateValue() {
        value = seconds + minutes * 60;
    }

    async function handleMinuteInput() {
        await tick();
        updateValue();
        if (minutesString.length >= 2) {
            minutesInput?.blur();
            secondsInput?.focus();
        }
    }

    let minutesInput = $state<HTMLInputElement>();
    let secondsInput = $state<HTMLInputElement>();
</script>

<div>
    <input
        type="text"
        bind:this={minutesInput}
        bind:value={minutesString}
        onfocus={() => (minutesString = "")}
        oninput={handleMinuteInput}
    />
    <span>:</span>
    <input
        type="text"
        bind:this={secondsInput}
        bind:value={secondsString}
        onfocus={async () => {
            await tick();
            secondsString = "";
        }}
        onchange={updateValue}
    />
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    div {
        background: $background-1;
        border-radius: 0.3em;
        font-size: 30px;
        font-weight: 600;
        display: inline-block;
    }

    input {
        border: none;
        width: 2ch;
        font-size: inherit;
        border-radius: 0.3em;
        padding: 0.3em;
        background: transparent;
        color: inherit;
    }
</style>
