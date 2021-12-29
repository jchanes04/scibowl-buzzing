import type { Socket } from "socket.io-client"
import type { DefaultEventsMap } from "socket.io-client/build/typed-events"
import type { MemberClean } from "./Member"

export type Event = {
    name: string,
    data: Record<string, unknown> | unknown[]
}

export default interface Debugger {
    gameId: string,
    gameName: string,
    memberId: string,
    memberName: string,
    clientEvents: Event[],
    websocketEvents: Event[],
    socket: Socket<DefaultEventsMap, DefaultEventsMap>,
    openWindows: Window[]
}

export default class Debugger {
    constructor(gameId: string, gameName: string, member: MemberClean, socket: Socket<DefaultEventsMap, DefaultEventsMap>) {
        this.memberId = member.id,
        this.memberName = member.name
        this.gameId = gameId
        this.gameName = gameName
        this.clientEvents = []
        this.websocketEvents = []
        this.socket = socket
        this.openWindows = []

        socket.onAny((event: string, ...args: any[]) => {
            this.websocketEvents.push({ name: event, data: args })
            this.openWindows.forEach(w => {
                const newMessageElement = w.document.createElement('p')
                newMessageElement.classList.add('ws-message')
                const newContent = w.document.createTextNode(`[WS]     ${event.padEnd(14, " ")} | ${JSON.stringify(args)}`)
                newMessageElement.appendChild(newContent)
                w.document.getElementById('event-container').appendChild(newMessageElement)
            })
        })
    }

    addEvent(name: string, data: Record<string, unknown> | unknown[]) {
        this.clientEvents.push({ name, data })
        this.openWindows.forEach(w => {
            const newMessageElement = w.document.createElement('p')
            newMessageElement.classList.add('client-message')
            const newContent = w.document.createTextNode(`[Client] ${name.padEnd(14, " ")} | ${JSON.stringify(data)}`)
            newMessageElement.appendChild(newContent)
            w.document.getElementById('event-container').appendChild(newMessageElement)
        })
    }

    reportError() {
        this.socket.emit('logDump', {
            clientEvents: this.clientEvents,
            websocketEvents: this.websocketEvents,
            gameId: this.gameId,
            gameName: this.gameName,
            memberId: this.memberId,
            memberName: this.memberName
        })
    }

    openDebugLog() {
        const newWindow = window.open("", this.gameName + " Debug Log", "width=800,height=600")
        this.openWindows.push(newWindow)
        newWindow.document.write(
            `<style> .ws-message { color: black; }  .client-message { color: red; } </style>
            <div id="event-container"></div>`
        )
    }
}