<script lang="ts">
    import Cookie from 'js-cookie'
    import { onMount } from 'svelte';
    interface OceanQuestion { 
        type: "MCQ"|"SAQ",
        questionText: string, 
        choices?: {
            W: string,
            X: string,  
            Y: string,
            Z: string
        },
        correctAnswer : string
    }
    let Started : boolean = false
    let Name : string
    let Password : string
    let Questions : OceanQuestion[]
    let answers =  {}
    let questionNumber : number = 0
    let timePerQuestion : number = 100
    let time : number = timePerQuestion
    onMount(()=> {
        let stored = Cookie.get('oceanTest')? JSON.parse(Cookie.get('oceanTest')) : undefined
        if (stored) {
            answers = stored
            questionNumber = Object.keys(answers).length 
            console.dir(answers)
            Password = " "
            startTest()
        }
    })
    async function startTest() {
        if (Password== " "){
            
            let res = await fetch("/api/ocean/questions")
            Questions =  await res.json()
            console.dir(Questions)
            Started = !Started
            console.log(Started)
            Cookie.set('oceanTest', JSON.stringify(answers),{path:"",expires:.01})
            setInterval(()=>{
                time -= 1
                time = Math.round(time)
                if (time<= 0){
                    nextQuestion()
                }
            },100)
        }
    }

    async function nextQuestion() {
        if (!answers[questionNumber]) answers[questionNumber] =""
        questionNumber +=1
        time = timePerQuestion
        let inputs : Record<string,string> = {}
        inputs.answers = JSON.stringify(answers)
        inputs.Name = Name
        console.dir(inputs)
        let answerSave = new URLSearchParams(inputs)
        
        let res = await fetch("/api/ocean/write?" + answerSave.toString())
        console.log(await res.json())
        Cookie.set('oceanTest', JSON.stringify(answers),{path:"",expires:.01})
        
    }
    

</script>


<main>
    {#if !Started}
        <input type="text" placeholder="Name" bind:value={Name} />
        <input type="text" placeholder="Password" bind:value={Password}/>
        <button id="start" on:click={startTest}> Start </button>
    {:else if questionNumber<Questions.length} 
        <h1>{time/10}</h1>      
        <h2 id="question">{Questions[questionNumber].questionText}</h2>
        
        {#if Questions[questionNumber].choices}
        <div class="radio-wrapper">
            <label class="radio-label">
                <input id="option-w-selected" type="radio" name="correct-answer" value="W" bind:group={answers[questionNumber]} />
                <span />
                <p>W)</p>  
                <p class="choice" id="W">{Questions[questionNumber].choices.W}</p>
            </label>
            <br />
            <label class="radio-label">
                <input id="option-x-selected" type="radio" name="correct-answer" value="X" bind:group={answers[questionNumber]} />
                <span />
                <p>X)</p>
                <p class="choice" id="X">{Questions[questionNumber].choices.X}</p>
            </label>
            <br />
            <label class="radio-label">
                <input id="option-y-selected" type="radio" name="correct-answer" value="Y" bind:group={answers[questionNumber]} />
                <span />
                <p>Y)</p>
                <p class="choice" id="Y">{Questions[questionNumber].choices.Y}</p>
            </label>
            <br />
            <label class="radio-label">
                <input id="option-z-selected" type="radio" name="correct-answer" value="Z" bind:group={answers[questionNumber]} />
                <span />
                <p>Z)</p>
                <p class="choice" id="Z">{Questions[questionNumber].choices.Z}</p>
            </label>          
        </div>
        {:else}
            <input type="text" id="answer" bind:value={answers[questionNumber]}/>
        {/if}

        <br /> <button on:click={nextQuestion}>nextQuestion</button>
    {:else}
        <h1>You finished.</h1>
        <h1>Congration.</h1>
    {/if}
</main>


<style lang="scss">
    
    main {
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        -o-user-select: none;
        user-select: none;
        margin: 3em auto;
        border-radius: 1em;
        text-align: center;
        padding: 1em;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    h1 {
        font-size: 44px;
        text-decoration: underline var(--blue) 3px;
        text-underline-offset: 0.2em;
    }

    .radio-wrapper {
        text-align: left;
        display: inline-block;
    }

    input[type="text"] {
        padding: 0.3em;
        font-size: 24px;
        margin: 0.5em auto;
        border: none;
        border-radius: 0.3em;
        box-sizing: border-box;
        width: 25ch;
        max-width: 80vw;
        text-align: center;
        font-family: 'Ubuntu';
        position: relative;

        &:focus::placeholder {
            color: transparent;
        }
    }


    .radio-label {
        cursor: pointer;
        padding-top: 0.3em;
        padding-bottom: 0.3em;
        display: inline-block;
        font-size: 20px;
        vertical-align: middle;

        input[type="radio"] {
            visibility: hidden;
            width: 0;
            height: 0;
        }

        .choice {
            width: 40ch;
        }

        p {
            width: 2.5ch;
            margin: 0;
            display: inline-block;
        }

        span {
            width: 1em;
            height: 1em;
            border-radius: 50%;
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
                width: 0.7em;
                height: 0.7em;
                border-radius: 0.35em;
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

    
    button {
        padding: 0.5em;
        color: #EEE;
        background: var(--green);
        border-radius: 0.3em;
        font-weight: bold;
        border: solid black 3px;
        font-size: 30px;
        cursor: pointer;
        margin-top: 1em;

        &:disabled {
            padding: calc(0.5em - 3px);
            border: solid var(--green) 3px;
            background: transparent;
            color: #444;
            cursor: default;
        }
    }
</style>