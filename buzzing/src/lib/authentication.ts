import fs from 'fs'
import jwt from 'jsonwebtoken'
import { ok, err, type Result } from 'neverthrow'
import { authError, type AuthError } from './errors'

const privateKey = fs.readFileSync('jwt.key')

export interface GameTokenData {
    memberId: string
    gameId: string
    spectator: boolean
}

export interface LoginTokenData {
    admin: boolean
    code: string
}

export function generateGameToken(data: { memberId: string, gameId: string, spectator?: boolean }, time: string | number = '6h') {
    return jwt.sign({
        memberId: data.memberId,
        gameId: data.gameId,
        spectator: data.spectator ?? false
    }, privateKey, { algorithm: 'RS256', expiresIn: time })
}

export async function getDataFromGameToken(token: string): Promise<Result<GameTokenData, AuthError>> {
    try {
        const tokenPayload = jwt.verify(token, privateKey, { algorithms: [ 'RS256' ] }) as jwt.JwtPayload & GameTokenData
        return ok({ memberId: tokenPayload.memberId, gameId: tokenPayload.gameId, spectator: tokenPayload.spectator })
    } catch (e) {
        return err(authError("Invalid or expired game token"))
    }
}

export async function generateLoginToken({ admin, code }: { admin: boolean, code: string }) {
    return jwt.sign({
        admin,
        code
    }, privateKey, { algorithm: 'RS256', expiresIn: '1h' })
}

export async function getDataFromLoginToken(token: string): Promise<Result<LoginTokenData, AuthError>> {
    try {
        const tokenPayload = jwt.verify(token, privateKey, { algorithms: [ 'RS256' ] }) as jwt.JwtPayload & LoginTokenData
        return ok({ admin: tokenPayload.admin, code: tokenPayload.code })
    } catch {
        return err(authError("Invalid or expired login token"))
    }
}
