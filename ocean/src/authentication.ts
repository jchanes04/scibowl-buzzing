import crypto from 'crypto'
const tokenToId: Record<string, string> = {}
const idToToken: Record<string, string> = {}

export function generateToken(userID: string) {
    let oldToken = idToToken[userID]
    if (oldToken) delete tokenToId[oldToken]

    let token = crypto.randomUUID()
    tokenToId[token] = userID
    idToToken[userID] = token
    return token
}

export function getIDFromToken(token: string) {
    return tokenToId[token]
}