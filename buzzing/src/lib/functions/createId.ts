import ShortUniqueId from "short-unique-id"

const tournamentCode = new ShortUniqueId({
    dictionary: "alphanum_upper",
    length: 8
})
const tournamentPassword = new ShortUniqueId({
    dictionary: "alphanum",
    length: 14
})


let seed = Math.floor(Math.random() * 1296).toString(36).toUpperCase()

const joinCodes: string[] = []

/*
    Why am I creating such a complicated ID system? IDFK man I think it's cool
    
    ID types are determined based on checksum (last digit of sum of digits in base 36):
        G: Game
        M: Member
        S: Message
        T: Team

    Game/Member/Team ID structure:
        xx   xxxxxx  x
       Seed   Time  Sum

    
*/

export function createGameID(): string {
    const timeComponent: string = Date.now().toString(36).substring(1)    // resets every ~13 hours, prevents collisions
    const seedComponent = incrementSeed()
    const body: string = seedComponent + timeComponent
    return body + getSumDigit("G", body)
}

export function createJoinCode(): string {
    let joinCode: string
    do {
        joinCode = Math.floor(Math.random() * 36).toString(36) + Math.floor(Math.random() * 36).toString(36) + Math.floor(Math.random() * 36).toString(36) + Math.floor(Math.random() * 36).toString(36)
    } while (joinCodes.includes(joinCode))
    return joinCode
}

export function createMemberID(): string {
    const timeComponent: string = Date.now().toString(36).substring(1)    // resets every ~13 hours, prevents collisions
    const seedComponent = incrementSeed()
    const body: string = seedComponent + timeComponent
    return body + getSumDigit("M", body)
}

export function createMessageID(): string {
    const timeComponent: string = Date.now().toString(36).substring(1)    // resets every ~13 hours, prevents collisions
    const seedComponent = incrementSeed()
    const body: string = seedComponent + timeComponent
    return body + getSumDigit("S", body)
}

export function createTeamID(): string {
    const timeComponent: string = Date.now().toString(36).substring(1)    // resets every ~13 hours, prevents collisions
    const seedComponent = incrementSeed()
    const body: string = seedComponent + timeComponent
    return body + getSumDigit("T", body)
}


function getSumDigit(targetSum: string, body: string) {
    let sum: number = 0
    for (let i = 0; i < body.length; i++) {
        sum += parseInt(body[i]!, 36)
    }
    const lastNumber: number = ((parseInt(targetSum, 36) - sum % 36) + 36) % 36
    return lastNumber.toString(36)
}

function incrementSeed() {
    const num = parseInt(seed, 36)
    const newNum = (num + 1) % 1296
    seed = newNum.toString(36)
    return seed
}

export function createTournamentCode(): string {
    return tournamentCode()
}

export function createTournamentPassword(): string {
    return tournamentPassword()
}