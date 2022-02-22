import fs from 'fs'
import jwt from 'jsonwebtoken'
import { games } from '$lib/server'

const privateKey = fs.readFileSync('jwt.key')

export function generateToken(data: { memberId: string, gameId: string }, time: string | number = '6h') {
    return jwt.sign(data, privateKey, { algorithm: 'RS256', expiresIn: time })
}

export async function getDataFromToken(token: string): Promise<{ memberId: string, gameId: string } | null> {
    try {
        const tokenPayload = jwt.verify(token, privateKey, { algorithms: [ 'RS256' ] }) as jwt.JwtPayload & { memberId: string, gameId: string }
        return { memberId: tokenPayload.memberId, gameId: tokenPayload.gameId }
    } catch (e) {
        return null
    }
}