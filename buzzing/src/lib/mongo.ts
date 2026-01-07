// Re-export all database functions from the new abstraction layer
// This file is kept for backward compatibility with existing imports

export { 
    updateGameScores,
    updateGameName,
    getTournamentScores,
    getTournament,
    getAllTournaments,
    createTournament,
    addGameToTournament,
    deleteGame,
    getStatistics,
    updateStatistics,
    type Stats
} from "$lib/db"
