import { internalMutation } from "./_generated/server";

/**
 * Internal mutation to clear all tables in the database.
 * Run from CLI using: npx convex run clearTables:clearAll
 * 
 * WARNING: This will delete ALL data in all tables!
 */
export const clearAll = internalMutation({
    args: {},
    handler: async (ctx) => {
        const tables = [
            "games",
            "users",
            "tournaments",
            "tournamentTeams",
        ] as const;

        const results: Record<string, number> = {};

        for (const table of tables) {
            const docs = await ctx.db.query(table).collect();
            for (const doc of docs) {
                await ctx.db.delete(doc._id);
            }
            results[table] = docs.length;
        }

        console.log("Cleared all tables:", results);
        return results;
    },
});
