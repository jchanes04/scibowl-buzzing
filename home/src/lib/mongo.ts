export interface User {
    _id: string, 
    email: string,
    secondaryEmail?: string,
    passwordHash: string,
    schoolName: string,
    teamIds: string[],
    createdAt: Date,
    admin?: boolean
}

export type UserClean = Omit<User, 'passwordHash'>

export type Team = {
    _id: string,
    teamName: string,
    userId: string,
    members: Member[],
    createdAt: Date
}

export type Grade = "8th and under" | "9th" | "10th" | "11th" | "12th"

export type Member = {
    _id: number,
    firstName: string,
    lastName: string,
    discordUsername: string,
    grade: Grade
}

import { Collection, Db, MongoClient } from 'mongodb'
import ShortUniqueId from 'short-unique-id'
import { env } from "$env/dynamic/private"
import { dev } from '$app/environment'

const uid = new ShortUniqueId({ dictionary: "alphanum", length: 10 })

const collections: {
    users?: Collection<User>,
    teams?: Collection<Team>
} = {}
const client = new MongoClient(env.DATABASE_URL, { directConnection: true })
var db: Db;
export async function init() {
    try {
        console.log("Connecting...")
        await client.connect()
        db = client.db(dev ? 'esbotDev' : 'esbot')
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

export async function getUser(userId: string): Promise<UserClean> {
    const fetchedUser = await collections.users.findOne({ _id: userId })
    if (fetchedUser) {
        const { passwordHash: _, ...withoutPassword } = fetchedUser
        return withoutPassword
    } else {
        return null
    }
}

export async function getAllUsers(): Promise<UserClean[]> {
    const cursor = collections.users.find({})
    const results = await cursor.toArray()
    return results.map(x => {
        const { passwordHash: _, ...withoutPassword } = x
        return withoutPassword
    })
}

export async function getUserFromEmail(email: string) {
    const fetchedUser = await collections.users.findOne({ email })
    if (fetchedUser) {
        const { passwordHash: _, ...withoutPassword } = fetchedUser
        return withoutPassword
    } else {
        return null
    }
}

export async function getUserFromSchoolName(schoolName: string) {
    return await collections.users.findOne({ schoolName })
}

export async function getUserPasswordHash(email: string): Promise<string> {
    const fetchedUser = await collections.users.findOne({ email })
    if (fetchedUser)
        return fetchedUser.passwordHash
    return null
}

export async function createUser(data: Omit<User, '_id' | 'createdAt'>) {
    const newUser = {
        ...data,
        _id: uid(),
        createdAt: new Date()
    }
    await collections.users.insertOne(newUser)
    return newUser
}

export async function addTeamToUser(userId: string, teamId: string) {
    return await collections.users.updateOne({ _id: userId }, { $push: { teamIds: teamId } })
}

export async function removeTeamFromUser(userId: string, teamId: string) {
    const fetchedUser = await collections.users.findOne({ _id: userId })
    const filteredTeams = fetchedUser.teamIds.filter(t => t !== teamId)
    return await collections.users.updateOne({ _id: userId }, { $set: { teamIds: filteredTeams } })
}

export async function updateUser(userId: string, setData: Partial<Omit<User, 'createdAt' | '_id' | 'passwordHash'>>, unsetData: {
    [K in keyof Omit<User, 'createdAt' | '_id' | 'passwordHash'>]?: true
} = {}) {
    return await collections.users.updateOne({ _id: userId }, { $set: setData, $unset: unsetData })
}

export async function getTeam(teamId: string) {
    return await collections.teams.findOne({ _id: teamId })
}

export async function createTeam(data: Omit<Team, 'createdAt' | '_id'>) {
    const newTeam = {
        ...data,
        _id: uid(),
        createdAt: new Date()
    }
    await collections.teams.insertOne(newTeam)
    return newTeam
}

export async function updateTeam(teamId: string, data: Partial<Omit<Team, 'createdAt' | '_id' | 'userId'>>) {
    return await collections.teams.updateOne({ _id: teamId }, { $set: data })
}

export async function deleteTeam(teamId: string) {
    const team = await collections.teams.findOne({ _id: teamId })
    removeTeamFromUser(team.userId, teamId)
    return await collections.teams.deleteOne({ _id: teamId })
    
}