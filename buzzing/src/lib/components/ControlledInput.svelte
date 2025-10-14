<script lang="ts">
    interface Props {
        validateFunction: (value: string) => boolean;
        name: string;
        value?: string;
        placeholderValue?: string;
    }

    let { validateFunction, name, value = $bindable(""), placeholderValue = "" }: Props = $props();

    let lastValue = $state(value);
</script>

<input
    type="text"
    placeholder={placeholderValue}
    {name}
    bind:value
    oninput={() => {
        if (validateFunction(value)) {
            lastValue = value.toUpperCase();
            value = value.toUpperCase();
        } else {
            value = lastValue;
        }
    }} />

<style lang="scss">
    @use "$styles/_global.scss" as *;

    input[type="text"] {
        @extend %text-input;

        font-size: 24px;
        margin: 0.5em auto;
        box-sizing: border-box;
        width: 25ch;
        max-width: 80vw;
        text-align: center;
    }
</style>
