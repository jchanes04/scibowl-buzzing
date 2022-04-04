import { Collection, Db, MongoClient } from 'mongodb'
import dotenv from 'dotenv';
import type { GameScores } from './classes/Game';
dotenv.config()

const collections: {
    scores?: Collection<GameScores>
} = {}
const client = new MongoClient(process.env.DATABASE_URL, { directConnection: true })
var db: Db;
async function init() {
    try {
        console.log("Connecting...")
        await client.connect()
        db = client.db("esbot")
        collections.scores = db.collection('scores')
        console.log('Connected')
        return true
    } catch (e) {
        console.log(e)
        await new Promise((resolve, reject) => {
            setTimeout(resolve, 1000);
        });
        return init();
    }
}

init()

export async function addGameScores(data: GameScores) {
    return await collections.scores.updateOne({ id: data.id }, data, { upsert: true })
}