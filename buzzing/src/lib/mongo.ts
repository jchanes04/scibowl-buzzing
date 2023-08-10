import { Collection, MongoClient } from "mongodb"
import { env } from "$env/dynamic/private"
import type { NamedScores } from "$lib/functions/scoreboard"

type GameScoreRecord = {
    gameId: string,
    name: string,
    scores: NamedScores
}

type Tournament = {
    code: string,
    name: string,
    gameIds: string[],
    passwordHash: string,
    admin?: boolean
}

const client = new MongoClient(env.DATABASE_URL, { directConnection: true })
type Collections = {
    gameScores: Collection<GameScoreRecord>,
    tournaments: Collection<Tournament>
}
async function init(): Promise<Collections> {
    try {
        console.log("Connecting...")
        await client.connect()

        const db = client.db('buzzing')
        console.log('Connected')
        return {
            gameScores: db.collection('gameScores'),
            tournaments: db.collection('tournaments')
        }
    } catch (e) {
        console.log(e)
        await new Promise((resolve) => {
            setTimeout(resolve, 10000);
        });
        return init();
    }
}

const { gameScores, tournaments } = await init()

export async function updateGameScores(gameId: string, name: string, scores: NamedScores) {
    try {
        await gameScores.updateOne({
            gameId
        }, {
            $set: {
                scores
            },
            $setOnInsert: {
                gameId,
                name
            }
        }, {
            upsert: true
        })
    } catch {

    }
}

export async function getTournamentScores(gameIds: string[]) {
    try {
        return gameScores.find({
            gameId: { $in: gameIds }
        }, {
            projection: {
                _id: 0
            }
        }).toArray()
    } catch {
        return []
    }
}

export async function getTournament(tournamentCode: string) {
    try {
        return tournaments.findOne({
            code: tournamentCode
        })
    } catch {
        return null
    }
}

export async function getAllTournaments(): Promise<Tournament[]> {
    try {
        return tournaments.find().toArray()
    } catch {
        return []
    }
}

export async function createTournament({ code, passwordHash, name}: { code: string, passwordHash: string, name: string }) {
    try {
        await tournaments.insertOne({
            code,
            passwordHash,
            name,
            gameIds: []
        })
    } catch {
        
    }
}

export async function addGameToTournament(code: string, gameId: string) {
    try {
        await tournaments.updateOne({
            code
        }, {
            $push: {
                gameIds: gameId
            }
        })
    } catch {
        
    }
}