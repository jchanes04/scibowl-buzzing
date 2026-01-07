import { Collection, MongoClient } from "mongodb"
import { env } from "$env/dynamic/private"
import type { NamedScores } from "$lib/functions/scoreboard"
import type { 
    DatabaseAdapter, 
    GameScoreRecord, 
    Tournament, 
    TournamentStatistics, 
    GameStatistics 
} from "./types"

type Collections = {
    gameScores: Collection<GameScoreRecord>,
    tournaments: Collection<Tournament>,
    tournamentStatistics: Collection<TournamentStatistics>
}

async function initMongo(): Promise<Collections> {
    const client = new MongoClient(env.DATABASE_URL, { directConnection: true })
    
    try {
        console.log("Connecting to MongoDB...")
        await client.connect()

        const db = client.db('buzzing')
        console.log('Connected to MongoDB')
        return {
            gameScores: db.collection('gameScores'),
            tournaments: db.collection('tournaments'),
            tournamentStatistics: db.collection('tournamentStatistics')
        }
    } catch (e) {
        console.log('MongoDB connection error:', e)
        await new Promise((resolve) => {
            setTimeout(resolve, 10000);
        });
        return initMongo();
    }
}

export async function createMongoAdapter(): Promise<DatabaseAdapter> {
    const { gameScores, tournaments, tournamentStatistics } = await initMongo()
    
    return {
        async updateGameScores(gameId: string, name: string, scores: NamedScores): Promise<void> {
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
                // ignore
            }
        },

        async updateGameName(gameId: string, name: string): Promise<void> {
            try {
                await gameScores.updateOne({
                    gameId
                }, {
                    $set: {
                        name
                    }
                })
            } catch {
                // ignore
            }
        },

        async getTournamentScores(gameIds: string[]): Promise<GameScoreRecord[]> {
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
        },

        async getTournament(tournamentCode: string): Promise<Tournament | null> {
            try {
                return tournaments.findOne({
                    code: tournamentCode
                })
            } catch {
                return null
            }
        },

        async getAllTournaments(): Promise<Tournament[]> {
            try {
                return tournaments.find().toArray()
            } catch {
                return []
            }
        },

        async createTournament({ code, passwordHash, name }: { code: string, passwordHash: string, name: string }): Promise<void> {
            try {
                await tournaments.insertOne({
                    code,
                    passwordHash,
                    name,
                    gameIds: []
                })
            } catch {
                // ignore
            }
        },

        async addGameToTournament(code: string, gameId: string): Promise<void> {
            try {
                tournaments.updateOne({
                    code
                }, {
                    $push: {
                        gameIds: gameId
                    }
                })
            } catch {
                // ignore
            }
        },

        async deleteGame(gameId: string): Promise<void> {
            try {
                gameScores.deleteOne({ gameId })
            } catch {
                // ignore
            }
        },

        async getStatistics(code: string): Promise<TournamentStatistics | null> {
            try {
                return tournamentStatistics.findOne({
                    code
                })
            } catch {
                return null
            }
        },

        async updateStatistics(code: string, statistics: GameStatistics): Promise<void> {
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
                // ignore
            }
        }
    }
}

