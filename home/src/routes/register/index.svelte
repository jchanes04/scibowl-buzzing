<script lang="ts">
    import { session } from "$app/stores";
    import isSchoolNameTaken from "$lib/functions/isSchoolNameTaken";
    import isUsernameTaken from "$lib/functions/isUsernameTaken";
    import { form as createForm, field } from 'svelte-forms'
    import { required, min, max } from 'svelte-forms/validators'
    function passwordsMatch(){
        return async (value: string) =>{ 
            return { 
                valid: ($passwordConfirm.value==$password.value), 
                name: 'password_match' 
            }
        };
    }

    function usernameTaken(){
        return async (value: string) =>{
            
            let taken = await isUsernameTaken(value)
            console.log(taken)
            return {
                valid: !taken,
                name:'taken'
            }
        }
    }

    function schoolNameTaken(){
        return async (value: string) =>{
            let taken = await isSchoolNameTaken(value)
            return {
                valid: !taken,
                name:'taken'
            }
        }
    }
    
    const schoolName = field('schoolName', '', [required(),min(5),max(40),schoolNameTaken()])
    const username = field('username','',[required(),min(5),max(40),usernameTaken()]) 
    const password = field('password','', [required(),min(5),max(30),passwordsMatch()])
    const passwordConfirm = field('passwordConfirm','',[required(),passwordsMatch()])

    const form = createForm(schoolName, username, password,passwordConfirm)
    $: errorMessage = errorMessages[$form.errors[0]]
    $: console.log($form.errors)
    $: feildsBlank = !((!!($username.value) && $schoolName.value) && ($password.value && $passwordConfirm.value))
    const errorMessages = {
        'schoolName.required':"School Name is required.",
        'schoolName.min':"School Name must have at least 5 characters",
        'schoolName.max':"School Name cannot exceed 40 characters",
        'schoolName.taken': "There is already a school registered under that name",
        'username.required':"Username is required.",
        'username.min':"Username must have at least 5 characters",
        'username.max':"Username cannot exceed 40 characters",
        'username.taken':"That username is taken.",
        'password.required':"Password is required.",
        'password.min':"Password must have at least 5 characters",
        'password.max':"Password cannot exceed 30 characters",
        'password.password_match':"Confirmation must match password feild",
        'passwordConfirm.required':"Password confirmation is reqired",        
        'passwordConfirm.password_match':"Confirmation must match password feild"
    }
</script>

<form action="/api/register" method="POST">
    <h1>Register your school</h1>
    <label for='schoolName'>School Name</label><br />
    <input type='text' name='school-name' bind:value={$schoolName.value}/><br />
    <label for='username'>Username</label><br />
    <input type='text' name='username' bind:value={$username.value} /><br />
    <label for='password'>Password</label><br />
    <input type='password' name='password' autocomplete="new-password"   bind:value={$password.value} on:input={()=>{$passwordConfirm.value = $passwordConfirm.value}}/><br />
    <label for='confirm-password' >Confirm Password</label><br />
    <input type="password" name='confirm-password' autocomplete="new-password" bind:value={$passwordConfirm.value} on:input={()=>{$password.value = $password.value}}/><br />
    {#if errorMessage}
        <p id="error">{errorMessage}</p>
    {/if}
    <button type="submit" disabled={!$form.valid || feildsBlank}>Submit</button>
    
</form>

<style lang="scss">
    #error {
        color: red;
    }
    form {
        margin: 0 5vw;
    }
    
    h1  {
        font-size: 80px;
        margin: .2em .0em .1em 0;

        @media (max-width: 900px) {
            font-size: 60px;
        }

        @media (max-width: 700px) {
            text-align: center;
            font-size: 40px;
        }

        @media (max-width: 550px) {
            font-size: 30px;
        }
        @media (max-width: 350px) {
            font-size: 60px;
        }
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

    input[type="password"] {
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

    button {
        padding: 0.5em;
        color: #EEE;
        background: var(--color-2);
        border-radius: 0.3em;
        font-weight: bold;
        border: solid black 3px;
        font-size: 24px;
        cursor: pointer;
        width: 8ch;
        
        &:disabled {
            border: solid var(--color-2) 3px;
            background: transparent;
            color: #444;
            cursor: default;
        }

        @media (max-width: 700px) {
            margin: 1em 2em;
            width: calc(100% - 4em);
        }
    }

    label {
        font-size: 20pt;
        margin: 1em 0 .1em 0;
    }
</style>