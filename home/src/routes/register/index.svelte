<script lang="ts">
    import { session } from "$app/stores";


</script>

<form action="/api/register" method="POST">
    <h1>Register your school</h1>
    <label for='schoolName'>School Name</label><br />
    <input type='text' name='school-name' /><br />
    <label for='username'>Username</label><br />
    <input type='text' name='username' /><br />
    <label for='password'>Password</label><br />
    <input type='text' name='password' autocomplete="new-password" /><br />
    <label for='confirm-password'>Confirm Password</label><br />
    <input type="text" name='confirm-password' autocomplete="new-password" /><br />

    <button type="submit">Submit</button>
</form>

<style lang="scss">
    form {
        margin: 0 5vw;
    }
    
    h1  {
        font-size: 80pt;
        margin: .2em .0em .5em 0;
    }

    input[type="text"] {
        padding: 0.3em;
        font-size: 20px;
        margin: 0.5em auto;
        border: none;
        border-radius: 0.3em;
        box-sizing: border-box;
        max-width: 80%;
        text-align: left;
        font-family: 'Ubuntu';
        position: relative;
        &:focus::placeholder {
            color: transparent;
        }
    }
    
    label {
        font-size: 20pt;
        margin: 1em 0 .1em 0;
    }
</style>