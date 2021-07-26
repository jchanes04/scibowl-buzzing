<script lang="ts">
    export let validateFunction: (value: string) => boolean
    export let name: string
    export let value: string = ""
    export let placeholderValue: string = ""
    let lastValue = value
</script>

<input type="text" placeholder={placeholderValue} name={name} bind:value on:input={() => {
    if (validateFunction(value)) {
        lastValue = value.toUpperCase()
        value = value.toUpperCase()
    } else {
        value = lastValue
    }
}} />

<style lang="scss">
    input[type="text"] {
        padding: 0.3em;
        font-size: 24px;
        margin: 0.5em auto;
        border: none;
        border-radius: 0.3em;
        box-sizing: border-box;
        width: 25ch;
        text-align: center;
        position: relative;

        &:focus::placeholder {
            color: transparent;
        }
    }
</style>