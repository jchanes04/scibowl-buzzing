<script lang="ts">
    import isSchoolNameTaken from "$lib/functions/isSchoolNameTaken";
    import isEmailTaken from "$lib/functions/isEmailTaken";
    import { form as createForm, field } from 'svelte-forms'
    import { required, min, max } from 'svelte-forms/validators'
    import { enhance } from "$app/forms"
    import { page } from "$app/stores";

    function passwordsMatch(){
        return () =>{ 
            return {
                valid: ($passwordConfirm.value==$password.value), 
                name: 'password_match' 
            }
        };
    }

    function emailTaken() {
        return async (value: string) =>{
            
            let taken = await isEmailTaken(value)

            return {
                valid: !taken,
                name:'taken'
            }
        }
    }

    function schoolNameTaken() {
        return async (value: string) =>{
            let taken = await isSchoolNameTaken(value)
            return {
                valid: !taken,
                name:'taken'
            }
        }
    }

    function emailFormatCorrect() {
        return async (value:string) =>{
            let valid = /.+@.+\..+/gi.test(value) || value === ""
            return {
                valid: valid,
                name: 'incorrect_format'
            }
        }
    }
    
    const schoolName = field('schoolName', '', [required(), min(5), max(80), schoolNameTaken()])
    const email = field('email', '', [required(), min(10), max(50), emailTaken(),emailFormatCorrect()]) 
    const secondaryEmail = field('secondaryEmail', '', [max(50), emailTaken(), emailFormatCorrect()])
    const password = field('password', '', [required(), min(5), passwordsMatch()])
    const passwordConfirm = field('passwordConfirm', '', [required(), passwordsMatch()])

    const form = createForm(schoolName, email, secondaryEmail, password,passwordConfirm)
    $: errorMessage = errorMessages[$form.errors[0]]
    $: fieldsBlank = !((!!($email.value) && $schoolName.value) && ($password.value && $passwordConfirm.value))
    const errorMessages = {
        'schoolName.required': "School Name is required",
        'schoolName.min': "School Name must have at least 5 characters",
        'schoolName.max': "School Name cannot exceed 80 characters",
        'schoolName.taken': "There is already a school registered under that name",
        'email.required': "Email is required",
        'email.min': "Email must have at least 10 characters",
        'email.max': "Email cannot exceed 50 characters",
        'email.taken': "Email is already taken",
        'email.incorrect_format': "Email is incorrectly formatted",
        'secondaryEmail.min': "Secondary email must have at least 10 characters",
        'secondaryEmail.max': "Secondary email cannot exceed 50 characters",
        'secondaryEmail.taken': "Secondary email is already taken",
        'secondaryEmail.incorrect_format': "Secondary email is incorrectly formatted",
        'password.required': "Password is required",
        'password.min': "Password must have at least 5 characters",
        'password.password_match': "Confirmation must match password field",
        'passwordConfirm.required': "Password confirmation is reqired",        
        'passwordConfirm.password_match': "Confirmation must match password field"
    }
</script>

<svelte:head>
    <title>Register a school</title>
    <meta name="description" content="Create an account for your school to manage and register your teams" />
</svelte:head>

<h1>Register your school</h1>
<form method="POST" use:enhance>
    {#if $page.form?.error}
        <p class="error">{$page.form.error}</p>
    {/if}
    <label class="required" for='schoolName'>School Name</label>
    <input type='text' name='school-name' bind:value={$schoolName.value}/><br />

    <label class="required" for='email'>Email</label>
    <p>This email will be used to log into the portal to manage teams</p>
    <input type='text' name='email' bind:value={$email.value} /><br />

    <label for='secondary-email'>Secondary Email</label>
    <p>This email will also receive updates alongside the primary email</p>
    <input type='text' name='secondary-email' bind:value={$secondaryEmail.value} /><br />

    <label class="required" for='password'>Password</label>
    <input type='password' name='password' autocomplete="new-password"   bind:value={$password.value} on:input={()=>{$passwordConfirm.value = $passwordConfirm.value}}/><br />
    
    <label class="required" for='confirm-password' >Confirm Password</label>
    <input type="password" name='confirm-password' autocomplete="new-password" bind:value={$passwordConfirm.value} on:input={()=>{$password.value = $password.value}}/><br />
    {#if errorMessage}
        <p id="error">{errorMessage}</p>
    {/if}
    <button type="submit" disabled={!$form.valid || fieldsBlank}>Submit</button>
</form>

<style lang="scss">
    #error {
        color: red;
    }
    form {
        margin: 0 calc(5vw + 3em) 5em;
    }
    
    h1  {
        font-size: 80px;
        margin: .4em .0em 0.8em 5vw;

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
        margin-top: 1em;
        
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
        display: block;

        &.required::after {
            content: ' *';
            color: red;
        }
    }

    p {
        margin: 0.5em 0 0.5em 1em;
        color: #333;
    }
</style>