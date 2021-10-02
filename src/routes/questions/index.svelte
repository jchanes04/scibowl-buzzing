<script lang="ts">
    import type { category } from "src/mongo";    
    import question from "$lib/components/question.svelte";
    import type { SaQuestion, McqQuestion} from "src/mongo";

    let questionLoaded : SaQuestion | McqQuestion
    let author: string
    let type: "MCQ" | "SA"
    let category: category
    let start,end
</script>


<svelte:head>
    <title>Enloe Scibowl Practice</title>
</svelte:head>

<h1>
    Here is our ripoff of ScibowlDB
</h1>
<div id="page">
    <question question={questionLoaded} />
    <div id="query">
        <h2>Make a query</h2>
        <input type="text" name="author" placeholder="author" id="author-input" bind:value={author} />
        <input type="date" name="start-date" bind:value={start}>
        <input type="date" name="end-date" bind:value={end}>
        <div class="radio-wrapper">
            Type
            <label for="any-teams">
                <input id="any-teams" type="radio" name="type" value="MCQ" bind:group={type} />
                <span />
                Multiple Choice
            </label>
            <br />
            <label for="individual-teams">
                <input id="individual-teams" type="radio" name="type" value="SA" bind:group={type} />
                <span />
                Short Answer 
            </label>
        </div>
        <br />
        <div id="checkbox-wrapper>
            Categories
            <input type="checkbox" name="bio" value="bio" bind:{category} />
            <label for="bio">Biology</label>
            <input type="checkbox" name="earth" value="earth" bind:{category} />
            <label for="earth">Earth and Space</label>
            <input type="checkbox" name="chem" value="chem" bind:{category} />
            <label for="chem">Chemistry</label>
            <input type="checkbox" name="physics" value="physics" bind:{category} />
            <label for="physics">Physics</label>
            <input type="checkbox" name="math" value="math" bind:{category} />
            <label for="math">Math</label>
            <input type="checkbox" name="energy" value="energy" bind:{category} />
            <label for="energy">Energy</label>
        </div>

    </div>
</div>


<style lang="scss">
    #page {
        display: grid;
        grid-template-columns: .3fr 2.5fr 0.5fr .3fr;
        grid-template-rows: max(10vh, 80px) auto auto;
        grid-template-areas: 
            ". question query ."
        column-gap: 1em;
        row-gap: 1em;
        min-height: 95vh;
    }
</style>