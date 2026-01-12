import { games } from "$lib/server";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
    // Return list of active game IDs (keys of games.games)
    // games.games is private, but we can iterate or use a getter if available.
    // Looking at GameManager.ts, 'games' property is private.
    // However, I can use games.find() to get all IDs? 
    // Wait, GameManager has `games` as private. I should expose a way to get IDs or make it public/getter.
    // Actually, let's check GameManager.ts again. It has `find`.

    // Better approach: modify GameManager to have a getter for keys or all games.
    // For now, I'll rely on a new getter in GameManager or just `Object.keys(games['games'])` if I can cast it, 
    // but better to add `get allGameIds()` to GameManager.

    // Let's assume I'll add `get activeGameIds()` to GameManager.ts first.
    return {
        activeGameIds: games.activeGameIds
    };
}) satisfies PageServerLoad;
