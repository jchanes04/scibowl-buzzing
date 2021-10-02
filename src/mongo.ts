export type category = "earth" | "bio" | "chem" | "physics" | "math" | "energy"
export type McqQuestion = {
    type: "MCQ",
    category: category,
    questionText: string,
    author: string,
    choices: {
        W: string,
        X: string,
        Y: string,
        Z: string
    },
    correctAnswer: "W" | "X" | "Y" | "Z",
    date: Date
}
export type SaQuestion = {
    type: "SA",
    category: category,
    questionText: string,
    author: string,
    correctAnswer: string,
    date: Date
}

import {Db, MongoClient} from 'mongodb'

let client = new MongoClient("mongodb://45.32.217.67:27108")
var db: Db;
export async function init() {
    try {
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

export async function addQuestion(question: SaQuestion | McqQuestion) {
    let collection  = db.collection("submittedQuestions")
    await collection.insertOne(question)
}

type questionQuery = {
    author?: string,
    category?: category,
    type?: "SA" | "MCQ",
    timeRange?: {
        startDate?: Date,
        endDate?: Date
    }
}
type mongoQuestionQuery = {
    author?: string,
    category?: category,
    type?: "SA" | "MCQ",
    date?: {
        $lt?: Date,
        $gte?: Date
    }
}

export async function getQuestions({ author, category, type, timeRange }: questionQuery) {
    console.log(author)
    let collection = db.collection("submittedQuestions")
    
    let mongoQuery: mongoQuestionQuery = {}
    if (author) mongoQuery.author = author
    if (category) mongoQuery.category = category
    if (type) mongoQuery.type = type
    if (timeRange && (timeRange.startDate || timeRange.endDate)) {
        mongoQuery.date = {}
        if (timeRange.startDate) mongoQuery.date.$gte = timeRange.startDate
        if (timeRange.endDate) mongoQuery.date.$lt = timeRange.endDate
    }
    console.dir(mongoQuery)
    
    let cursor = collection.find(mongoQuery)
    return <(SaQuestion | McqQuestion)[]>(await cursor.toArray())
}