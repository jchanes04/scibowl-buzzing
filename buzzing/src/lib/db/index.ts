import { env } from "$env/dynamic/private"
import type { DatabaseAdapter } from "./types"
import type { NamedScores } from "$lib/functions/scoreboard"

// Re-export types for convenience
export type { Stats, GameStatistics, Tournament, TournamentStatistics, GameScoreRecord } from "./types"

let adapterPromise: Promise<DatabaseAdapter> | null = null

async function getAdapter(): Promise<DatabaseAdapter> {
    if (adapterPromise) return adapterPromise
    
    const useLocalDb = env.USE_LOCAL_DB === 'true' || !env.DATABASE_URL
    
    if (useLocalDb) {
        console.log('Using SQLite database for local development')
        const { createSqliteAdapter } = await import('./sqlite')
        adapterPromise = createSqliteAdapter()
    } else {
        console.log('Using MongoDB database')
        const { createMongoAdapter } = await import('./mongodb')
        adapterPromise = createMongoAdapter()
    }
    
    return adapterPromise
}

// Initialize the adapter
const adapter = await getAdapter()

// Export all database functions
export async function updateGameScores(gameId: string, name: string, scores: NamedScores) {
    return adapter.updateGameScores(gameId, name, scores)
}

export async function updateGameName(gameId: string, name: string) {
    return adapter.updateGameName(gameId, name)
}

export async function getTournamentScores(gameIds: string[]) {
    return adapter.getTournamentScores(gameIds)
}

export async function getTournament(tournamentCode: string) {
    return adapter.getTournament(tournamentCode)
}

export async function getAllTournaments() {
    return adapter.getAllTournaments()
}

export async function createTournament(data: { code: string, passwordHash: string, name: string }) {
    return adapter.createTournament(data)
}

export async function addGameToTournament(code: string, gameId: string) {
    return adapter.addGameToTournament(code, gameId)
}

export async function deleteGame(gameId: string) {
    return adapter.deleteGame(gameId)
}

export async function getStatistics(code: string) {
    return adapter.getStatistics(code)
}

export async function updateStatistics(code: string, statistics: { teamStats: Record<string, import("./types").Stats>, playerStats: Record<string, import("./types").Stats> }) {
    return adapter.updateStatistics(code, statistics)
}

