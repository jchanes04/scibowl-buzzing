import fs from 'fs'
import jwt from 'jsonwebtoken'

const privateKey = fs.readFileSync('jwt.key')

export function generateGameToken(data: { memberId: string, gameId: string, spectator?: boolean }, time: string | number = '6h') {
    return jwt.sign({
        memberId: data.memberId,
        gameId: data.gameId,
        spectator: data.spectator ?? false
    }, privateKey, { algorithm: 'RS256', expiresIn: time })
}

export async function getDataFromGameToken(token: string): Promise<{ memberId: string, gameId: string, spectator: boolean } | null> {
    try {
        const tokenPayload = jwt.verify(token, privateKey, { algorithms: [ 'RS256' ] }) as jwt.JwtPayload & { memberId: string, gameId: string, spectator: boolean }
        return { memberId: tokenPayload.memberId, gameId: tokenPayload.gameId, spectator: tokenPayload.spectator }
    } catch (e) {
        return null
    }
}

export async function generateLoginToken({ admin, code }: { admin: boolean, code: string }) {
    return jwt.sign({
        admin,
        code
    }, privateKey, { algorithm: 'RS256', expiresIn: '1h' })
}

export async function getDataFromLoginToken(token: string): Promise<{ admin: boolean, code: string } | null> {
    try {
        const tokenPayload = jwt.verify(token, privateKey, { algorithms: [ 'RS256' ] }) as jwt.JwtPayload & { admin: boolean, code: string }
        return { admin: tokenPayload.admin, code: tokenPayload.code }
    } catch {
        return null
    }
}