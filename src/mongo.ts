export type category = "earth" | "bio" | "chem" | "physics" | "math" | "energy"
export interface McqBase {
    type: "MCQ",
    category: category,
    questionText: string,
    authorName: string,
    authorId?: string,
    choices: {
        W: string,
        X: string,
        Y: string,
        Z: string
    },
    correctAnswer: "W" | "X" | "Y" | "Z"
}

export interface SaBase {
    type: "SA",
    category: category,
    questionText: string,
    authorName: string,
    authorId?: string,
    correctAnswer: string
}

export interface McqQuestion extends McqBase{
    id: string,
    date: Date
}
export interface SaQuestion extends SaBase {
    id: string,
    date: Date
}

export interface User {
    id: string, 
    username: string
}

import {Db, MongoClient} from 'mongodb'

let client = new MongoClient("mongodb://45.32.217.67:27108")
var db: Db;
export async function init() {
    try {
        console.log("Connecting...")
        await client.connect()
        db = client.db("scibowl")
        return true
    } catch (e) {
        console.log(e)
        await new Promise((resolve, reject) => {
            setTimeout(resolve, 1000);
        });
        return init();
    }
}

export async function addQuestion(question: SaBase | McqBase) {
    let collection  = db.collection("submittedQuestions")
    
    let searchString = question.questionText + " " + question.correctAnswer
    if (question.type === "MCQ") {
        searchString += " " + question.choices.W + " " + question.choices.X + " " + question.choices.Y + " " + question.choices.Z
    }
    await collection.insertOne({
        id: createID(),
        ...question,
        searchString,
        date: new Date()
    })
}

type questionQuery = {
    author?: string,
    keywords?: string,
    categories?: category[],
    types?: ("SA" | "MCQ") [],
    timeRange?: {
        startDate?: Date,
        endDate?: Date
    }
}
type mongoQuestionQuery = {
    author?: string,
    $text?: { $search: string },
    category?: {$in: category[]},
    type?: {$in: ("SA" | "MCQ") []},
    date?: {
        $lt?: Date,
        $gte?: Date
    }
}

export async function getQuestions({ author, keywords, categories, types, timeRange }: questionQuery) {
    console.log(author)
    let collection = db.collection("submittedQuestions")
    
    let mongoQuery: mongoQuestionQuery = {}
    if (author) mongoQuery.author = author
    if (keywords) mongoQuery.$text = { $search: keywords }
    if (categories?.length) mongoQuery.category = { $in: categories }
    if (types?.length) mongoQuery.type = {$in: types}
    if (timeRange && (timeRange.startDate || timeRange.endDate)) {
        mongoQuery.date = {}
        if (timeRange.startDate) mongoQuery.date.$gte = timeRange.startDate
        if (timeRange.endDate) mongoQuery.date.$lt = timeRange.endDate
    }
    console.dir(mongoQuery)
    
    let cursor = collection.find(mongoQuery)
    return <(SaQuestion | McqQuestion)[]>(await cursor.toArray())
}

export async function editQuestion(newQuestion: SaQuestion | McqQuestion) {
    let collection  = db.collection("submittedQuestions")
    let searchString = newQuestion.questionText + " " + newQuestion.correctAnswer
    if (newQuestion.type === "MCQ") {
        searchString += " " + newQuestion.choices.W + " " + newQuestion.choices.X + " " + newQuestion.choices.Y + " " + newQuestion.choices.Z
    }
    await collection.findOneAndReplace({ id: newQuestion.id }, {
        ...newQuestion,
        searchString,
        date: new Date()
    })
}

export async function getQuestionByID(id : string){
    let collection = db.collection("submittedQuestions")
    let result = await collection.findOne({ id })
    return result || null
}

export async function getUserFromID(id: string): Promise<User | null> {
    let collection = db.collection("users")
    let result = await collection.findOne({ id })
    console.log(result)
    return result?.id ? {
        id: result.id,
        username: result.username
    } : null
}


function createID() {
    let time = Date.now()
    let time1 = time.toString(16).slice(0, 4)
    let time2 = time.toString(16).slice(4, 8)
    let random1 = Math.floor(Math.random() * 16).toString(16)
    let random2 = Math.floor(Math.random() * 16).toString(16)
    let id = time2 + random1 + time1 + random2
    return id
}