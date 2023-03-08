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
    @use '$styles/_global.scss' as *;

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