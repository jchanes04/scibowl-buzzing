import Database from 'better-sqlite3'
import type { NamedScores } from "$lib/functions/scoreboard"
import type { 
    DatabaseAdapter, 
    GameScoreRecord, 
    Tournament, 
    TournamentStatistics, 
    GameStatistics 
} from "./types"
import path from 'path'

const DB_PATH = process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'buzzing-local.db')

let db: Database.Database | null = null

function getDb(): Database.Database {
    if (!db) {
        db = new Database(DB_PATH)
        initializeTables()
    }
    return db
}

function initializeTables() {
    const database = db!
    
    // Create tables if they don't exist
    database.exec(`
        CREATE TABLE IF NOT EXISTS game_scores (
            game_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            scores TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tournaments (
            code TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            game_ids TEXT NOT NULL DEFAULT '[]',
            password_hash TEXT NOT NULL,
            admin INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS tournament_statistics (
            code TEXT PRIMARY KEY,
            player_stats TEXT NOT NULL DEFAULT '{}',
            team_stats TEXT NOT NULL DEFAULT '{}'
        );
    `)
    
    console.log('SQLite database initialized at:', DB_PATH)
}

export async function createSqliteAdapter(): Promise<DatabaseAdapter> {
    const database = getDb()
    
    return {
        async updateGameScores(gameId: string, name: string, scores: NamedScores): Promise<void> {
            try {
                const stmt = database.prepare(`
                    INSERT INTO game_scores (game_id, name, scores) 
                    VALUES (?, ?, ?)
                    ON CONFLICT(game_id) DO UPDATE SET scores = excluded.scores
                `)
                stmt.run(gameId, name, JSON.stringify(scores))
            } catch (e) {
                console.error('Error updating game scores:', e)
            }
        },

        async updateGameName(gameId: string, name: string): Promise<void> {
            try {
                const stmt = database.prepare(`
                    UPDATE game_scores SET name = ? WHERE game_id = ?
                `)
                stmt.run(name, gameId)
            } catch (e) {
                console.error('Error updating game name:', e)
            }
        },

        async getTournamentScores(gameIds: string[]): Promise<GameScoreRecord[]> {
            try {
                if (gameIds.length === 0) return []
                
                const placeholders = gameIds.map(() => '?').join(',')
                const stmt = database.prepare(`
                    SELECT game_id, name, scores FROM game_scores 
                    WHERE game_id IN (${placeholders})
                `)
                const rows = stmt.all(...gameIds) as { game_id: string, name: string, scores: string }[]
                
                return rows.map(row => ({
                    gameId: row.game_id,
                    name: row.name,
                    scores: JSON.parse(row.scores) as NamedScores
                }))
            } catch (e) {
                console.error('Error getting tournament scores:', e)
                return []
            }
        },

        async getTournament(tournamentCode: string): Promise<Tournament | null> {
            try {
                const stmt = database.prepare(`
                    SELECT code, name, game_ids, password_hash, admin 
                    FROM tournaments WHERE code = ?
                `)
                const row = stmt.get(tournamentCode) as { 
                    code: string, 
                    name: string, 
                    game_ids: string, 
                    password_hash: string, 
                    admin: number 
                } | undefined
                
                if (!row) return null
                
                return {
                    code: row.code,
                    name: row.name,
                    gameIds: JSON.parse(row.game_ids) as string[],
                    passwordHash: row.password_hash,
                    admin: row.admin === 1 ? true : undefined
                }
            } catch (e) {
                console.error('Error getting tournament:', e)
                return null
            }
        },

        async getAllTournaments(): Promise<Tournament[]> {
            try {
                const stmt = database.prepare(`
                    SELECT code, name, game_ids, password_hash, admin FROM tournaments
                `)
                const rows = stmt.all() as { 
                    code: string, 
                    name: string, 
                    game_ids: string, 
                    password_hash: string, 
                    admin: number 
                }[]
                
                return rows.map(row => ({
                    code: row.code,
                    name: row.name,
                    gameIds: JSON.parse(row.game_ids) as string[],
                    passwordHash: row.password_hash,
                    admin: row.admin === 1 ? true : undefined
                }))
            } catch (e) {
                console.error('Error getting all tournaments:', e)
                return []
            }
        },

        async createTournament({ code, passwordHash, name }: { code: string, passwordHash: string, name: string }): Promise<void> {
            try {
                const stmt = database.prepare(`
                    INSERT INTO tournaments (code, name, game_ids, password_hash, admin)
                    VALUES (?, ?, '[]', ?, 0)
                `)
                stmt.run(code, name, passwordHash)
            } catch (e) {
                console.error('Error creating tournament:', e)
            }
        },

        async addGameToTournament(code: string, gameId: string): Promise<void> {
            try {
                // Get current game_ids
                const getStmt = database.prepare(`SELECT game_ids FROM tournaments WHERE code = ?`)
                const row = getStmt.get(code) as { game_ids: string } | undefined
                
                if (row) {
                    const gameIds = JSON.parse(row.game_ids) as string[]
                    gameIds.push(gameId)
                    
                    const updateStmt = database.prepare(`UPDATE tournaments SET game_ids = ? WHERE code = ?`)
                    updateStmt.run(JSON.stringify(gameIds), code)
                }
            } catch (e) {
                console.error('Error adding game to tournament:', e)
            }
        },

        async deleteGame(gameId: string): Promise<void> {
            try {
                const stmt = database.prepare(`DELETE FROM game_scores WHERE game_id = ?`)
                stmt.run(gameId)
            } catch (e) {
                console.error('Error deleting game:', e)
            }
        },

        async getStatistics(code: string): Promise<TournamentStatistics | null> {
            try {
                const stmt = database.prepare(`
                    SELECT code, player_stats, team_stats 
                    FROM tournament_statistics WHERE code = ?
                `)
                const row = stmt.get(code) as { 
                    code: string, 
                    player_stats: string, 
                    team_stats: string 
                } | undefined
                
                if (!row) return null
                
                return {
                    code: row.code,
                    playerStats: JSON.parse(row.player_stats),
                    teamStats: JSON.parse(row.team_stats)
                }
            } catch (e) {
                console.error('Error getting statistics:', e)
                return null
            }
        },

        async updateStatistics(code: string, statistics: GameStatistics): Promise<void> {
            try {
                const stmt = database.prepare(`
                    INSERT INTO tournament_statistics (code, player_stats, team_stats)
                    VALUES (?, ?, ?)
                    ON CONFLICT(code) DO UPDATE SET 
                        player_stats = excluded.player_stats,
                        team_stats = excluded.team_stats
                `)
                stmt.run(
                    code, 
                    JSON.stringify(statistics.playerStats), 
                    JSON.stringify(statistics.teamStats)
                )
            } catch (e) {
                console.error('Error updating statistics:', e)
            }
        }
    }
}

