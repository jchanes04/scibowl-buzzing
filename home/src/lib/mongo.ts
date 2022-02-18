export interface User {
    id: string, 
    username: string,
    passwordHash: string,
    schoolName: string,
    teamIds: string[],
    createdAt: Date
}

export type Team = {
    id: string,
    teamName: string,
    userId: string,
    members: Member[],
    transactionId?: string,
    createdAt: Date
}

export type Member = {
    firstName: string,
    lastName: string,
    discordUsername: string,
    grade: "8th and under" | "9th" | "10th" | "11th" | "12th"
}

import {Collection, Db, MongoClient} from 'mongodb'

const collections: {
    users?: Collection<User>,
    teams?: Collection<Team>
} = {}
const client = new MongoClient("mongodb://40.117.128.184:27017")
var db: Db;
async function init() {
    try {
        console.log("Connecting...")
        await client.connect()
        db = client.db("esbot")
        collections.teams = db.collection('teams')
        collections.users = db.collection('users')
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

export async function getUser(userId: string): Promise<User> {
    return collections.users.findOne({ id: userId })
}

export async function createUser(data: Omit<User, 'id' | 'createdAt'>) {
    const newUser = {
        ...data,
        id: createID(),
        createdAt: new Date()
    }
    await collections.users.insertOne(newUser)
    return newUser
}

export async function getTeam(teamId: string) {
    return collections.teams.findOne({ id: teamId })
}

export async function createTeam(data: Team) {
    return collections.teams.insertOne({
        ...data,
        id: createID(),
        createdAt: new Date()
    })
}

function createID() {
    const time = Date.now()
    const time1 = time.toString(16).slice(0, 4)
    const time2 = time.toString(16).slice(4, 8)
    const random1 = Math.floor(Math.random() * 16).toString(16)
    const random2 = Math.floor(Math.random() * 16).toString(16)
    const id = time2 + random1 + time1 + random2
    return id
}