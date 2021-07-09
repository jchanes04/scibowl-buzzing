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