import fs from 'fs'
import jwt from 'jsonwebtoken'
import { getUser } from './mongo'

const privateKey = fs.readFileSync('jwt.key')

export function generateToken(userId: string, time: string | number = '6h') {
    return jwt.sign({ userId }, privateKey, { algorithm: 'RS256', expiresIn: time })
}

export async function getUserFromToken(token: string) {
    try {
        let tokenPayload = <jwt.JwtPayload>jwt.verify(token, privateKey, { algorithms: [ 'RS256' ] })
        let userData = await getUser(tokenPayload.userId)
        return userData || null
    } catch (e) {
        return null
    }
}