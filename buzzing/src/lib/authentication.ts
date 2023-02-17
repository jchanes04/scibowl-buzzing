import fs from 'fs'
import jwt from 'jsonwebtoken'

const privateKey = fs.readFileSync('jwt.key')

export function generateToken(data: { memberId: string, gameId: string, spectator?: boolean }, time: string | number = '6h') {
    return jwt.sign({
        memberId: data.memberId,
        gameId: data.gameId,
        spectator: data.spectator ?? false
    }, privateKey, { algorithm: 'RS256', expiresIn: time })
}

export async function getDataFromToken(token: string): Promise<{ memberId: string, gameId: string, spectator: boolean } | null> {
    try {
        const tokenPayload = jwt.verify(token, privateKey, { algorithms: [ 'RS256' ] }) as jwt.JwtPayload & { memberId: string, gameId: string, spectator: boolean }
        return { memberId: tokenPayload.memberId, gameId: tokenPayload.gameId, spectator: tokenPayload.spectator }
    } catch (e) {
        return null
    }
}