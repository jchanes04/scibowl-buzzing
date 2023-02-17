<script lang="ts">
    import type { Team } from "$lib/mongo";

    export let teams: Team[]
    export let closeCallback: () => void

    let paymentTeams: string[] = []
</script>

<div class="confirm-modal">
    <h2>Pay Registration Fees</h2>
    <form method="POST" action="/edit/checkout">
        <ul>
            {#each teams.filter(t => t.paid) as team}
                <li>
                    ✔️ {team.name} (Paid)
                </li>
            {/each}
            {#each teams.filter(t => !t.paid) as team, i}
                <li>
                    <label for="team-{i}">
                        <input id="team-{i}" type="checkbox" name="payment-teams" value={team._id} bind:group={paymentTeams} />
                        <span />
                        {team.name}
                    </label>
                </li>
            {/each}
        </ul>
        {#if paymentTeams.length}
            <p>Pay ${paymentTeams.length * 2}0.00 for {paymentTeams.length} teams</p>
        {/if}
        <button on:click={closeCallback}>Cancel</button>
        <button type="submit" disabled={!paymentTeams.length}>Pay</button>
    </form>
</div>

<style lang="scss">
    .confirm-modal {
        background: var(--color-5);
        border-radius: 15px;
        min-width: 200px;
        text-align: center;
        padding: 1em 2em;
    }

    button {
        padding: 0.5em;
        margin-left: 1em;
        color: #EEE;
        background: var(--color-2);
        border-radius: 0.3em;
        font-weight: bold;
        border: solid black 3px;
        font-size: 16px;
        cursor: pointer;
        
        &:disabled {
            border: solid var(--color-2) 3px;
            background: transparent;
            color: #444;
            cursor: default;
        }
    }

    ul {
        list-style: none;
        text-align: left;
    }

    label {
        cursor: pointer;
        padding-top: 0.3em;
        padding-bottom: 0.3em;
        display: inline-block;

        h2 {
            margin: 0;
        }

        input {
            visibility: hidden;
            width: 0;
            height: 0;
        }

        span {
            width: 1em;
            height: 1em;
            border-radius: 0.2em;
            border: #CCC 2px solid;
            display: inline-block;
            position: relative;
            background: #FFF;
            vertical-align: text-top;
            margin-right: 0.3em;

            &::after {
                content: '';
                position: absolute;
                display: none;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 0.6em;
                height: 0.6em;
                border-radius: 0.1em;
                background: var(--blue);
            }
        }

        &:hover > span {
            border-color: var(--green);
        }

        input:checked ~ span::after {
            display: inline-block;
        }
    }
</style>