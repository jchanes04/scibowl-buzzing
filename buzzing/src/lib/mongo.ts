import { Collection, MongoClient, type Filter } from "mongodb"
import { env } from "$env/dynamic/private"
import type { NamedScores } from "$lib/functions/scoreboard"

const client = new MongoClient(env.DATABASE_URL, { directConnection: true })
type Collections = {
    gameScores: Collection<{
        gameId: string,
        name: string,
        scores: NamedScores
    }>
}
async function init(): Promise<Collections> {
    try {
        console.log("Connecting...")
        await client.connect()

        const db = client.db('buzzing')
        console.log('Connected')
        return {
            gameScores: db.collection('gameScores')
        }
    } catch (e) {
        console.log(e)
        await new Promise((resolve) => {
            setTimeout(resolve, 10000);
        });
        return init();
    }
}

const { gameScores } = await init()

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

