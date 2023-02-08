export interface User {
    _id: string, 
    email: string,
    secondaryEmail?: string,
    passwordHash: string,
    schoolName: string,
    teamIds: string[],
    createdAt: Date,
    admin?: boolean,
    verified?: boolean
}

export type UserClean = Omit<User, 'passwordHash'>

export type Team = {
    _id: string,
    name: string,
    userId: string,
    members: Member[],
    createdAt: Date,
    paid: boolean
}

export type Grade = "8th and under" | "9th" | "10th" | "11th" | "12th"

export type Member = {
    id: number,
    firstName: string,
    lastName: string,
    discordUsername: string,
    grade: Grade
}

export type ConfirmationCode = {
    _id: string,
    userId: string
}

export type PasswordResetCode = {
    userId: string,
    created: Date,
    hashedCode: string
}

import { Collection, MongoClient } from 'mongodb'
import ShortUniqueId from 'short-unique-id'
import { env } from "$env/dynamic/private"
import { dev } from '$app/environment'
import { promisify } from "util"
import { randomBytes, createHash } from "crypto"
import argon2 from "argon2"

const uid = new ShortUniqueId({ dictionary: "alphanum", length: 10 })
const generateCode = new ShortUniqueId({ dictionary: "alphanum", length: 25 })
const randomBytesAsync = promisify(randomBytes)

const client = new MongoClient(env.DATABASE_URL, { directConnection: true })
async function init(): Promise<{
    teams: Collection<Team>,
    users: Collection<User>,
    confirmationCodes: Collection<ConfirmationCode>,
    passwordResetCodes: Collection<PasswordResetCode>
}> {
    try {
        console.log("Connecting...")
        await client.connect()

        const db = client.db(dev ? 'esbotDev' : 'esbot')
        console.log('Connected')
        return {
            teams: db.collection('teams'),
            users: db.collection('users'),
            confirmationCodes: db.collection('confirmationCodes'),
            passwordResetCodes: db.collection('passwordResetCodes')
        }
    } catch (e) {
        console.log(e)
        await new Promise((resolve, reject) => {
            setTimeout(resolve, 10000);
        });
        return init();
    }
}

const { teams, users, confirmationCodes, passwordResetCodes } = await init()
passwordResetCodes.deleteMany({})

export async function getUser(userId: string): Promise<UserClean | null> {
    const fetchedUser = await users.findOne({ _id: userId })
    if (fetchedUser) {
        const { passwordHash: _, ...withoutPassword } = fetchedUser
        return withoutPassword
    } else {
        return null
    }
}

export async function getAllUsers(): Promise<UserClean[]> {
    const cursor = users.find({})
    const results = await cursor.toArray()
    return results.map(x => {
        const { passwordHash: _, ...withoutPassword } = x
        return withoutPassword
    })
}

export async function getUserFromEmail(email: string) {
    const fetchedUser = await users.findOne({ email })
    if (fetchedUser) {
        const { passwordHash: _, ...withoutPassword } = fetchedUser
        return withoutPassword
    } else {
        return null
    }
}

export async function getUserFromSchoolName(schoolName: string) {
    return users.findOne({ schoolName })
}

export async function getUserPasswordHash(email: string): Promise<string | null> {
    const fetchedUser = await users.findOne({ email })
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
    await users.insertOne(newUser)
    return newUser
}

export async function deleteUser(userId: string) {
    await users.deleteOne({ _id: userId })
}

export async function addTeamToUser(userId: string, teamId: string) {
    return users.updateOne({ _id: userId }, { $push: { teamIds: teamId } })
}

export async function removeTeamFromUser(userId: string, teamId: string) {
    const fetchedUser = await users.findOne({ _id: userId })
    if (!fetchedUser) return null

    const filteredTeams = fetchedUser.teamIds.filter(t => t !== teamId)
    return users.updateOne({ _id: userId }, { $set: { teamIds: filteredTeams } })
}

export async function updateUser(userId: string, setData: Partial<Omit<User, 'createdAt' | '_id' | 'passwordHash'>>, unsetData: {
    [K in keyof Omit<User, 'createdAt' | '_id' | 'passwordHash'>]?: true
} = {}) {
    return users.updateOne({ _id: userId }, { $set: setData, $unset: unsetData })
}

export async function getTeam(teamId: string) {
    return teams.findOne({ _id: teamId })
}

export async function getAllTeams() {
    return teams.find({}).toArray()
}

export async function getTeamsByUser(userId: string) {
    return teams.find({ userId }).toArray()
}

export async function createTeam(data: Omit<Team, 'createdAt' | '_id'>) {
    const newTeam = {
        ...data,
        _id: uid(),
        createdAt: new Date()
    }
    await Promise.all([
        teams.insertOne(newTeam),
        addTeamToUser(data.userId, newTeam._id)
    ])
    return newTeam
}

export async function updateTeam(teamId: string, data: Partial<Omit<Team, 'createdAt' | '_id' | 'userId'>>) {
    return teams.updateOne({ _id: teamId }, { $set: data })
}

export async function deleteTeam(teamId: string) {
    const team = await teams.findOne({ _id: teamId })
    if (!team) return null
    
    removeTeamFromUser(team.userId, teamId)
    return teams.deleteOne({ _id: teamId })
}

export async function generateConfirmationCode(userId: string) {
    await confirmationCodes.deleteMany({ userId })
    const code = generateCode()
    await confirmationCodes.insertOne({
        _id: code,
        userId
    })
    return code
}

export async function verifyUser(code: string) {
    const codeDocument = await confirmationCodes.findOne({
        _id: code
    })
    if (codeDocument) {
        await Promise.all([
            updateUser(codeDocument.userId, { verified: true }),
            confirmationCodes.deleteOne({ _id: code })
        ])
        return true
    } else {
        return false
    }
}

export async function generatePasswordResetCode(userId: string) {
    const buffer = await randomBytesAsync(48)
    const code = buffer.toString("base64url")
    await passwordResetCodes.insertOne({
        userId,
        created: new Date(),
        hashedCode: createHash("sha256").update(code).digest("hex")
    })
    return code
}

export async function resetPassword(code: string, newPassword: string) {
    const hashedCode = createHash("sha256").update(code).digest("hex")
    const doc = await passwordResetCodes.findOne({
        hashedCode
    })
    if (!doc || Date.now() - doc.created.getTime() > 3_600_000) return null

    await Promise.all([
        users.updateOne({ _id: doc.userId }, { $set: {
            passwordHash: await argon2.hash(newPassword)
        } }),
        passwordResetCodes.deleteMany({ userId: doc.userId })
    ])
    return true
}