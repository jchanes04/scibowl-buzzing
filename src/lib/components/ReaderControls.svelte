<script lang="ts">
    type Message = {
        text: string
        type: 'buzz' | 'notification' | 'warning' | 'success'
    }

    import type { Socket } from 'socket.io-client';
    import type { Writable } from 'svelte/store'
    import type Timer from './Timer.svelte'
    export let socket: Writable<Socket>
    export let messages: Writable<Message[]>
    
    let advancedShowing: boolean = false

    function newQ() {
        let category = (<HTMLInputElement>document.getElementById('category')).value
        let bonus = (<HTMLInputElement>document.getElementById('bonus')).checked
        $socket.emit('newQ',{category,bonus})

        $messages = [...$messages, {
            type: 'notification',
            text: 'new question opened'
        }]
    }
    
    function startTimer() {
        $socket.emit('startTimer')
    }
    function endGame() {
        $socket.emit('endGame')
    }
    function showData() {
        
    }
    function clearScores() {
        $socket.emit('clearScores')
    }
    function scoreQuestion(score: 'correct' | 'incorrect' | 'penalty') {
        $socket.emit('scoreQuestion', score)
    }
</script>

    <div id="buttons" class="gamediv">
        <select name="categories" id="category">
            <option value="earth">Earth and Space</option>
            <option value="bio">Biology</option>
            <option value="chem">Chemistry</option>
            <option value="physics">Physics</option>
            <option value="math">Math</option>
            <option value="energy">Energy</option>
        </select>
        <label id="bonus-label" for="bonus" class="container">Bonus<input id="bonus" type="checkbox" class="default" name="bonus" value="N/A"><span class="checkbox"></span></label><br>
        <button on:click={newQ} id="new-question">New Question</button>
        <button on:click={startTimer} id="start-timer">Start Timer</button>
        <button on:click={() => {advancedShowing = !advancedShowing}} id="showAdvanced">Advanced Controls</button>
        {#if advancedShowing}
            <div> 
                <button on:click={endGame} id="endGame">End Game</button>
                <button on:click={showData} id="showData">Show Game Data</button>
                <button on:click={clearScores} id="clearScores">Clear Scores</button>
                <div id="gameDatashow"></div>
            </div><br><br>
        {/if}
        <button on:click={() => scoreQuestion('correct')} >correct</button> 
        <button on:click={() => scoreQuestion('incorrect')} >incorrect</button> 
        <button on:click={() => scoreQuestion('penalty')} >penalty</button> 

        
        <div id="warn">
            <p id="warning"></p><br>
            <div id="warnButtons">
                <button id="yes">yes</button>
                <button id="no">no</button>
            </div>
        </div>
    </div>
<style>
    div {
        grid-area: control-panel;
        border-left: solid 2px;
        border-right: solid 2px;
        border-bottom: solid 2px;
        border-top: solid 1px;
        box-sizing: border-box;
    }


    #buttons {
        padding: 24px 24px 24px 24px;
        min-height: 240px;
        border-style: solid;
    }

    button {
        background: var(--green);
        border: 3px solid var(--blue);
        border-radius: 7px;
        font-size: 24px;
        font-weight: 600;
        padding: 15px 15px 15px 15px;
        cursor: pointer;
    }

    button:disabled {
        color: #333;
        background: var(--green-dull);
        border-color: var(--blue-dull);
        cursor: default;
    }

    #warn {
        text-align: center;
        background-color: white;
        border-color: #000000;
        border-radius: 5px;
        border-style: solid;
        position: fixed;
        top: 35%;
        left: 30%;
        width: 40%;
        height: 30%;
        display:none;
    }

    #warning {
        font-size:24px;
    }

    #warnButtons{
        margin: auto;
    }


</style>

