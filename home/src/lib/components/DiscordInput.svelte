<script lang="ts">
    export let value

    let username: string = value.split("#")[0] || ""
    let discriminator: string = value.split("#")[1] || ""
    
    $: value = username + "#" + discriminator
</script>

<div>
    <input type="text" class="username-input" bind:value={username} placeholder="JohnTheDoe" />
    <span>#</span>
    <input type="text" class="discriminator-input" bind:value={discriminator} placeholder="1234" />
</div>

<style lang="scss">
    div {
        display: inline-flex;
        align-items: center;
        background-color: field;
        margin: 0.5em auto;
        padding: 0.3em;
        border-radius: 0.3em;
        width: min(80%, 300px);
    }

    input[type="text"] {
        font-size: 20px;
        border: none;
        box-sizing: border-box;
        text-align: left;
        font-family: 'Ubuntu';
        position: relative;
        &:focus::placeholder {
            color: transparent;
        }

        &.username-input {
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
            width: min(80%, 300px);
        }

        &.discriminator-input {
            width: 5.5ch;
            padding-left: 1ch;
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
        }
    }

    span {
        font-size: 1.2em;
    }
</style>