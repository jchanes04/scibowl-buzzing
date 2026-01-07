import type { NamedScores } from "$lib/functions/scoreboard"
import type { Category } from "$lib/classes/Game"

export type GameScoreRecord = {
    gameId: string,
    name: string,
    scores: NamedScores
}

export type Tournament = {
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

export type TournamentStatistics = {
    code: string,
    playerStats: Record<string, Stats>,
    teamStats: Record<string, Stats>
}

export type GameStatistics = {
    teamStats: Record<string, Stats>,
    playerStats: Record<string, Stats>
}

export interface DatabaseAdapter {
    updateGameScores(gameId: string, name: string, scores: NamedScores): Promise<void>
    updateGameName(gameId: string, name: string): Promise<void>
    getTournamentScores(gameIds: string[]): Promise<GameScoreRecord[]>
    getTournament(tournamentCode: string): Promise<Tournament | null>
    getAllTournaments(): Promise<Tournament[]>
    createTournament(data: { code: string, passwordHash: string, name: string }): Promise<void>
    addGameToTournament(code: string, gameId: string): Promise<void>
    deleteGame(gameId: string): Promise<void>
    getStatistics(code: string): Promise<TournamentStatistics | null>
    updateStatistics(code: string, statistics: GameStatistics): Promise<void>
}

