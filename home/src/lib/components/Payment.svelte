<script lang='ts'>
    import type { Team } from '$lib/mongo';
    import HelpBox from "./HelpBox.svelte";
    import { form as createForm, field, form } from 'svelte-forms'
    import { min, pattern } from 'svelte-forms/validators';
    import isRepeatTransactionID from '$lib/functions/isRepeatTransactionID';
    import { session } from '$app/stores';
    export let teams : Team[]

    function RepeatTransactionID(){
        return async (value: string) =>{
            let repeat = await isRepeatTransactionID(value,$session.userData.id)
            return { valid: !repeat, name: 'repeat' }
        }
    }

    const transactionID = field('transactionID','',[pattern(/^[0-9]+$/),min(Math.pow(10,10)),RepeatTransactionID()])
    const form = createForm(transactionID)

    $: errorMessage = errorMessages[$form.errors[0]]
    $: console.log($form.errors)
    const errorMessages = {
        "transactionID.pattern":"Transaction ID should only contain arabic numberals.",
        "transactionID.min":"Transaction IDs are all really long",
        "transactionID.repeat":"We already have this transactionID from you."
    }
</script>
<div id="payment">
                    
    <h1>Payment</h1><br />
    <h2>You've payed for ___ teams.</h2>
    <h2>To register your {teams.length} remaining teams, your price is ${Math.round(100*teams.length*15*1.0297+49)/100} (${teams.length*15} base + ${Math.round(teams.length*15*2.97+49)/100} transaction fee) <HelpBox>Price per team is $15 and the transaction fee is 2.97% plus a flat rate of $0.49</HelpBox></h2><br />
    <h2><a target="_blank" href="https://www.paypal.com/donate/?business=WCN9EFSTWAR4G&amount={teams.length*15*1.0297+.49}&no_recurring=1&currency_code=USD">Pay here</a> then come back to input the transaction ID</h2><br/>
    <form>
        <label for='TransactionID'>Transaction ID <HelpBox>You will find a transaction ID after you pay near the bottom of the payment window. Contact us if you have any trouble.</HelpBox></label>  <br/> 
        <input name='TransactionID' type='text' bind:value={$transactionID.value} /> <button disabled={!$form.valid}>Submit</button><p id="error">{errorMessage ? errorMessage : ""}<p><br />
    </form>
    <h1>Why are we using donate with Paypal?</h1><br/>
    Due to issues with taxation and age restrictions (none of us are adults), we are unable to use integrated payment processors, leaving donate with paypal as the easiest option for payments that allows us to somewhat reliably track transactions. If you wish to send money through any other source (zelle, venmo, ect.) or your school is paying for you please contact us. 
    
</div>

<style lang="scss">
    #payment{
        margin:.5em
    }
    p{
        margin: 0;
    }
    #error{
        color:red;
    }
    h1{
        margin:.5em 0em 0em 0em;   
    }
    h2{
        margin-top: 0em;
    }
    label {
        font-size: 20pt;
        margin: 1em 0 .1em 0;
    }
    input[type="text"] {
        padding: 0.3em;
        font-size: 20px;
        margin: 0.5em auto;
        border: none;
        border-radius: 0.3em;
        box-sizing: border-box;
        width: min(90%,30em);
        text-align: left;
        font-family: 'Ubuntu';
        position: relative;
        &:focus::placeholder {
            color: transparent;
        }
    }
    button {
        padding: 0.5em;
        margin-left: 1em;
        color: #EEE;
        background: var(--color-2);
        border-radius: 0.3em;
        font-weight: bold;
        border: solid black 3px;
        font-size: 20px;
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
</style>