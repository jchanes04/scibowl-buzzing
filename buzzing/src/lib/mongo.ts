import { Collection, MongoClient } from "mongodb"
import { env } from "$env/dynamic/private"
import type { NamedScores } from "$lib/functions/scoreboard"
import type { Category } from "./classes/Game"

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

export type Stats = {
    gamesPlayed: number,
    tuh: number,
    buzzes: number,
    ppg: number,
    npg: number,
    bpg: number,
    accuracy: number,
    categories: Record<Category, {
        tuh: number,
        buzzes: number,
        ppg: number,
        npg: number,
        bpg: number,
        accuracy: number
    }>
}

type TournamentStatistics = {
    code: string,
    playerStats: Record<string, Stats>,
    teamStats: Record<string, Stats>
}

const client = new MongoClient(env.DATABASE_URL, { directConnection: true })
type Collections = {
    gameScores: Collection<GameScoreRecord>,
    tournaments: Collection<Tournament>,
    tournamentStatistics: Collection<TournamentStatistics>
}
async function init(): Promise<Collections> {
    try {
        console.log("Connecting...")
        await client.connect()

        const db = client.db('buzzing')
        console.log('Connected')
        return {
            gameScores: db.collection('gameScores'),
            tournaments: db.collection('tournaments'),
            tournamentStatistics: db.collection('tournamentStatistics')
        }
    } catch (e) {
        console.log(e)
        await new Promise((resolve) => {
            setTimeout(resolve, 10000);
        });
        return init();
    }
}

const { gameScores, tournaments, tournamentStatistics } = await init()

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

export async function updateGameName(gameId: string, name: string) {
    try {
        await gameScores.updateOne({
            gameId
        }, {
            $set: {
                name
            }
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
        tournaments.updateOne({
            code
        }, {
            $push: {
                gameIds: gameId
            }
        })
    } catch {
        
    }
}

export async function deleteGame(gameId: string) {
    try {
        gameScores.deleteOne({ gameId })
    } catch {
        
    }
}

export async function getStatistics(code: string) {
    try {
        return tournamentStatistics.findOne({
            code
        })
    } catch {
        return null
    }
}

type GameStatistics = {
    teamStats: Record<string, Stats>,
    playerStats: Record<string, Stats>
}

export async function updateStatistics(code: string, statistics: GameStatistics) {
    try {
        tournamentStatistics.updateOne({
            code
        }, {
            $set: {
                ...statistics
            },
            $setOnInsert: {
                code
            }
        }, {
            upsert: true
        })
    } catch {

    }
}