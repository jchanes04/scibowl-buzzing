<script lang='ts'>
    import type { Team } from '$lib/mongo';
    import HelpBox from "./HelpBox.svelte";
    import { form as createForm, field, form } from 'svelte-forms'
    import { min, pattern } from 'svelte-forms/validators';
    import isRepeatTransactionID from '$lib/functions/isRepeatTransactionID';
    import { session } from '$app/stores';
    
    let paidTeams = Math.floor($session.userData.paymentAmount /15)
    console.dir($session.userData)
    export let teams : Team[]
    let transactionSuccess : boolean = false

    

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
    $: price = Math.round(100*(teams.length-paidTeams)*15*1.0297+49)/100

    const errorMessages = {
        "transactionID.pattern":"Transaction ID should only contain arabic numberals.",
        "transactionID.min":"Transaction IDs are all really long",
        "transactionID.repeat":"We already have this transactionID from you."
    }

    async function handleSubmit(amount:number){
        const params = {transactionID: $transactionID.value,amount:amount.toString(), userID:$session.userData.id}
        const urlParams = new URLSearchParams(params)
        const res = await fetch('api/addTransaction?'+ urlParams.toString())
        if(res){
            transactionSuccess = true
            paidTeams =teams.length;
        }
    }

</script>
<div id="payment">
                    
    <h1>Payment</h1><br />
    {#if paidTeams==teams.length}
        <h2>Thanks! Unless you did something naughty<HelpBox>If you put in fake transactionIDs, we will know and will check, but please dont put fake transactionIDs.</HelpBox>, you've finished the payment process for ESBOT.</h2>
        <h2>If you wish to register a new team, press the Add team button in the menu on the left.</h2>
        <h2>You are free to edit your registration until two days before the competition at which point, you should contact us.</h2>
    {:else if paidTeams>teams.length}
        <h2>You've paid for {paidTeams} teams, but have only signed up {teams.length}. </h2>
        <h2>If you think this is a mistake or need a refund please contact us privately.</h2>
        <h2>You are free to edit your registration until two days before the competition after which point you should contact us for any changes to be made.</h2>        
    {:else}
        <h2>You've paid for {paidTeams} teams. <HelpBox>If you think this is a mistake or need a refund, contact us.</HelpBox></h2>
        <h2>To register your {teams.length-paidTeams} remaining teams, your price is ${price} (${(teams.length-paidTeams)*15} base + ${Math.round((price-(teams.length-paidTeams)*15)*100)/100} transaction fee) <HelpBox>Price per team is $15 and the transaction fee is 2.97% plus a flat rate of $0.49</HelpBox></h2><br />
        <h2><a target="_blank" href="https://www.paypal.com/donate/?business=WCN9EFSTWAR4G&amount={price}&no_recurring=1&currency_code=USD">Pay here</a> then come back to input the transaction ID</h2><br/>
        <label for='transaction-id'>Transaction ID</label> <HelpBox>You will find a transaction ID after you pay near the bottom of the payment window. Contact us if you have any trouble.</HelpBox>  <br/> 
        <input id="transaction-id" name='transaction-id' type='text' bind:value={$transactionID.value} /> 
        <button disabled={!$form.valid} on:click={()=>{handleSubmit(price)}}>Submit</button>
        <p id="error">{errorMessage ? errorMessage : ""}<p>
        {#if transactionSuccess}
            <p id="success">Your payment has been sucessfully processed.<p>
        {/if}
        <br />
        <h1>Why are we using donate with Paypal?</h1><br/>
        Due to issues with taxation and age restrictions, we are unable to use integrated payment processors, leaving donate with Paypal as the easiest option for payments that allows us to somewhat reliably track transactions. If you wish to send money through any other source (Zelle, Venmo, etc.) or your school is paying for you, please contact us. 
    {/if}
</div>

<style lang="scss">
    #payment{
        margin: .5em 8vw;
    }
    p{
        margin: 0;
    }
    #error{
        color:red;
    }
    #success{
        color:green;
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