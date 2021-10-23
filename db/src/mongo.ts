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
    username: string,
    avatarHash?: string
}

export interface UserSettings {
    id: string,
    colors: string[],
    imgUrl?: string
}

import {Db, MongoClient} from 'mongodb'

let client = new MongoClient("mongodb://45.32.217.67:27108")
var db: Db;
async function init() {
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

init();

export async function addQuestion(question: SaBase | McqBase) {
    let collection = db.collection("submittedQuestions")
    
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
    authorName?: string,
    authorId: string,
    keywords?: string,
    categories?: category[],
    types?: ("SA" | "MCQ") [],
    timeRange?: {
        startDate?: Date,
        endDate?: Date
    }
}
type mongoQuestionQuery = {
    authorName?: string,
    authorId?: string,
    $text?: { $search: string },
    category?: {$in: category[]},
    type?: {$in: ("SA" | "MCQ") []},
    date?: {
        $lt?: Date,
        $gte?: Date
    }
}

export async function getQuestions({ authorName, authorId, keywords, categories, types, timeRange }: questionQuery) {
    let collection = db.collection("submittedQuestions")
    
    let mongoQuery: mongoQuestionQuery = {}
    if (authorName) mongoQuery.authorName = authorName
    if (authorId) mongoQuery.authorId = authorId
    if (keywords) mongoQuery.$text = { $search: keywords }
    if (categories?.length) mongoQuery.category = { $in: categories }
    if (types?.length) mongoQuery.type = {$in: types}
    if (timeRange && (timeRange.startDate || timeRange.endDate)) {
        mongoQuery.date = {}
        if (timeRange.startDate) mongoQuery.date.$gte = timeRange.startDate
        if (timeRange.endDate) mongoQuery.date.$lt = timeRange.endDate
    }
    console.log("Mongo Query:")
    console.dir(mongoQuery)
    let cursor = collection.find(mongoQuery)
    return <(SaQuestion | McqQuestion)[]>(await cursor.toArray())
}

export async function editQuestion(newQuestion: Partial<SaQuestion | McqQuestion>) {
    let collection  = db.collection("submittedQuestions")
    let searchString = newQuestion.questionText + " " + newQuestion.correctAnswer
    if (newQuestion.type === "MCQ") {
        searchString += " " + newQuestion.choices.W + " " + newQuestion.choices.X + " " + newQuestion.choices.Y + " " + newQuestion.choices.Z
    }
    await collection.updateOne({ id: newQuestion.id }, { $set: {
        ...newQuestion,
        searchString
    }})
}

export async function getQuestionByID(id : string){
    let collection = db.collection("submittedQuestions")
    let result = await collection.findOne({ id })
    console.dir(result.questions)
    return result || null
}

export async function getUserByID(id: string){
    let collection = db.collection("users")
    let result = await collection.findOne({ id })
    return result || null
}

export async function getUserFromID(id: string): Promise<User | null> {
    let collection = db.collection("users")
    let result = await collection.findOne({ id })
    return result?.id ? {
        id: result.id,
        username: result.username,
        avatarHash: result.avatarHash
    } : null
}

export async function updateUser(id: string, data: Partial<User>) {
    let collection = db.collection('users')
    return await collection.updateOne({ id }, { $set: data })
}

export async function updateNameOnQuestions(authorId: string, authorName: string) {
    let collection = db.collection('submittedQuestions')
    return await collection.updateMany({ authorId }, { $set: { authorName } });
}

export async function getUserSettings(id: string): Promise<UserSettings | null> {
    let collection = db.collection("userSettings")
    let result = await collection.findOne({ id })
    return result?.id ? <UserSettings>result : null
}

export async function updateAvatarHash(id: string, avatarHash: string) {
    let collection = db.collection("users")
    return await collection.updateOne({ id }, { $set: {
        avatarHash
    } })
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