<script lang="ts">
    import { run } from "svelte/legacy";

    import { tick } from "svelte";

    interface Props {
        value?: number;
    }

    let { value = $bindable(0) }: Props = $props();
    let minutesString = $state("");
    run(() => {
        minutesString = Math.floor(value / 60)
            .toString()
            .padStart(2, "0");
    });
    let secondsString = $state("");
    run(() => {
        secondsString = (value % 60).toString().padStart(2, "0");
    });
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

    let minutesInput: HTMLInputElement | null = $state(null);
    let secondsInput: HTMLInputElement | null = $state(null);
</script>

<div>
    <input
        type="text"
        bind:this={minutesInput}
        bind:value={minutesString}
        onfocus={() => (minutesString = "")}
        oninput={handleMinuteInput} />
    <span>:</span>
    <input
        type="text"
        bind:this={secondsInput}
        bind:value={secondsString}
        onfocus={async () => {
            await tick();
            secondsString = "";
        }}
        onchange={updateValue} />
</div>

<style lang="scss">
    div {
        background: white;
        border-radius: 0.3em;
        font-size: 18px;
        display: inline-block;
    }

    input {
        border: none;
        width: 4ch;
        font-size: inherit;
        border-radius: 0.3em;
        padding: 0.3em;
    }
</style>
