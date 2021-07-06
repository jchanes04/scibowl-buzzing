<script lang="ts">
    export let socket
    export let messages
    
    let advancedShowing: boolean = false

    function newQ() {
        let category = (<HTMLInputElement>document.getElementById('category')).checked
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
    function endGame(){
        $socket.emit('endGame')
    }
    function showData(){
        
    }
    function clearScores(){
        $socket.emit('clearScores')
    }
</script>

<div id="game">
    <div id="buttons" class="gamediv">
        <select name="categories" id="category">
            <option value="e">Earth and Space</option>
            <option value="b">Biology</option>
            <option value="c">Chemistry</option>
            <option value="p">Physics</option>
            <option value="m">Math</option>
            <option value="eg">Energy</option>
        </select>
        <label id="bonus-label" for="bonus" class="container">Bonus<input id="bonus" type="checkbox" class="default" name="bonus" value="N/A"><span class="checkbox"></span></label><br>
        <button on:click={newQ} id="new-question" class="button-2">New Question</button>
        <button on:click={startTimer} id="start-timer" class="button-2">Start Timer</button>
        <button on:click={() => {advancedShowing = !advancedShowing}} id="showAdvanced" class="button-2">Advanced Controls</button>
        {#if advancedShowing}
            <div id="Advanced"> 
                <button on:click={endGame} id="endGame" class="button-2">End Game</button>
                <button on:click={showData} id="showData" class="button-2">Show Game Data</button>
                <button on:click={clearScores} id="clearScores" class="button-2">Clear Scores</button>
                <div id="gameDatashow"></div>
            </div><br><br>
        {/if}
        <button id="correct" class="button-2">correct</button> 
        <button id="incorrect" class="button-2">incorrect</button> 
        <button id="penalty" class="button-2">penalty</button> 
    </div>
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
    }

    .row {
        display: flex;
        flex-direction: row;
    }

    .gamediv {
        border-color: black;
        border-width: 2px;
    }
    
    #player-list-div {
        width: 25%;
        min-height: 200px;
        max-height: 400px;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        border-left-style: solid;
        border-top-style: solid;
    }

    .reader-label {
        color: #f09231;
    }

    #scoreboard h2 {
        display: inline-block;
    }

    #scoreboard {
        width: 45%;
        border-left-style: solid;
        border-top-style: solid;
        border-right-style: solid;
        position: relative;
    }


    #buttons {
        padding: 24px 24px 24px 24px;
        min-height: 240px;
        border-style:solid ;
    }

    .button-2 {
        background: hsl(145, 50%, 40%);
        border: 3px solid hsl(210, 100%, 38%);
        border-radius: 7px;
        font-size: 24px;
        font-weight: 600;
        padding: 15px 15px 15px 15px;
        cursor: pointer;
    }

    .button-2:disabled {
        color: #333;
        background: #146737;
        border-color: #004990;
        cursor: default;
    }

    #Advanced {
        display: none;
    }

    #timer {
        position: absolute;
        top: 10px;
        right: 20px;
        display: none;
        font-size: 54px;
        margin-block-start: 0em;
        margin-block-end: 0em;
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

