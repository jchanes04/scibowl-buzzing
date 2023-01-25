export async function load({ params, fetch }: LoadInput) {

    const res = await fetch(`/api/spectate/${params.id}`)

    if (res.ok) {
        const json = await res.json()
        return {
    gameInfo: {
        ...json?.gameInfo,
        gameId: params.id,
    } as GameInfo,
    teamList: json.teamList,
    moderatorList: json.moderatorList
}
    }

    return {}
}
