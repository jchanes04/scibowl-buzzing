export interface User {
    id: string, 
    username: string,
    passwordHash: string,
    schoolName: string,
    teamIds: string[],
    createdAt: Date
}

export type UserClean = Omit<User, 'passwordHash'>

export type Team = {
    id: string,
    teamName: string,
    userId: string,
    members: Member[],
    transactionId?: string,
    createdAt: Date
}

export type Grade = "8th and under" | "9th" | "10th" | "11th" | "12th"


export type Member = {
    id: number,
    firstName: string,
    lastName: string,
    discordUsername: string,
    grade: Grade
}

import { Collection, Db, MongoClient } from 'mongodb'

const collections: {
    users?: Collection<User>,
    teams?: Collection<Team>
} = {}
const client = new MongoClient("mongodb://40.117.128.184:27017", { directConnection: true })
var db: Db;
async function init() {
    try {
        console.log("Connecting...")
        await client.connect()
        db = client.db("esbot")
        collections.teams = db.collection('teams')
        collections.users = db.collection('users')
        console.log('Connected')
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

export async function getUser(userId: string): Promise<UserClean> {
    const fetchedUser = await collections.users.findOne({ id: userId })
    if (fetchedUser) {
        const { passwordHash: _, _id: __, ...withoutPassword } = fetchedUser
        return withoutPassword
    } else {
        return null
    }
}

export async function getUserFromUsername(username: string) {
    const fetchedUser = await collections.users.findOne({ username })
    if (fetchedUser) {
        const { passwordHash: _, _id: __, ...withoutPassword } = fetchedUser
        return withoutPassword
    } else {
        return null
    }
}

export async function getUserPasswordHash(username: string): Promise<string> {
    const fetchedUser = await collections.users.findOne({ username })
    if (fetchedUser)
        return fetchedUser.passwordHash
    return null
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

export async function addTeamToUser(userId: string, teamId: string) {
    return await collections.users.updateOne({ id: userId }, { $push: { teamIds: teamId } })
}

async function removeTeamFromUser(userId: string, teamId: string) {
    const fetchedUser = await collections.users.findOne({ id: userId })
    const filteredTeams = fetchedUser.teamIds.filter(t => t !== teamId)
    return await collections.users.updateOne({ id: userId }, { $set: { teamIds: filteredTeams } })
}

export async function getTeam(teamId: string) {
    const fetchedTeam = await collections.teams.findOne({ id: teamId })
    if (fetchedTeam) {
        const { _id: _, ...withoutId } = fetchedTeam
        return withoutId
    } else {
        return null
    }
}

export async function createTeam(data: Omit<Team, 'createdAt' | 'id'>) {
    const newTeam = {
        ...data,
        id: createID(),
        createdAt: new Date()
    }
    await collections.teams.insertOne(newTeam)
    return newTeam
}

export async function updateTeam(teamId: string, data: Omit<Team, 'createdAt' | 'id' | 'userId'>) {
    return await collections.teams.updateOne({ id: teamId }, { $set: data })
}

export async function deleteTeam(teamId: string) {
    const team = await collections.teams.findOne({ id: teamId })
    removeTeamFromUser(team.userId, teamId)
    return await collections.teams.deleteOne({ id: teamId })
    
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