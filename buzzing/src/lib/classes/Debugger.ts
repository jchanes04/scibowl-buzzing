import type { MyMember } from "$lib/stores/myMember"
import type { Socket } from "socket.io-client"
import { env } from "$env/dynamic/public"

export type Event = {
    name: string,
    data: Record<string, unknown> | unknown[],
    type: "Client" | "WS"
}

export default interface Debugger {
    gameId: string,
    gameName: string,
    memberId: string,
    memberName: string,
    events: Event[],
    socket: Socket,
    openWindow: Window | null
}

export default class Debugger {
    constructor(gameId: string, gameName: string, member: MyMember, socket: Socket) {
        this.memberId = member.id,
        this.memberName = member.name
        this.gameId = gameId
        this.gameName = gameName
        this.events = []
        this.socket = socket
        this.openWindow = null

        socket.onAny((event: string, ...args: any[]) => {
            this.events.push({ name: event, data: args, type: "WS" })

            if (this.openWindow) {
                const newMessageElement = this.openWindow.document.createElement('p')
                newMessageElement.classList.add('ws-message')
                const newContent = this.openWindow.document.createTextNode(`[WS]     ${event.padEnd(14, " ")} | ${JSON.stringify(args)}`)
                newMessageElement.appendChild(newContent)
                this.openWindow.document.getElementById('event-container')?.appendChild(newMessageElement)
            }
        })

        window.addEventListener("message", (m) => {
            console.dir(m)
            if (m.data === "reportBug") this.reportError()
        })
    }

    addEvent(name: string, data: Record<string, unknown> | unknown[]) {
        this.events.push({ name, data, type: 'Client' })

        if (this.openWindow) {
            const newMessageElement = this.openWindow.document.createElement('p')
            newMessageElement.classList.add('client-message')
            const newContent = this.openWindow.document.createTextNode(`[Client] ${name.padEnd(14, " ")} | ${JSON.stringify(data)}`)
            newMessageElement.appendChild(newContent)
            this.openWindow.document.getElementById('event-container')?.appendChild(newMessageElement)
        }
    }

    reportError() {
        this.socket.emit('logDump', {
            events: this.events,
            gameId: this.gameId,
            gameName: this.gameName,
            memberId: this.memberId,
            memberName: this.memberName
        })
    }

    openDebugLog() {
        const newWindow = window.open("", "DebugLog", "width=800,height=600")
        this.openWindow = newWindow
        newWindow?.document.write(
            `<script>function reportBug() {window.opener.postMessage("reportBug", "${env.PUBLIC_HOST_URL}")}</script>
            <style> .ws-message { color: black; }  .client-message { color: red; }
                .report {
                    position: absolute;
                    bottom: 30px;
                    right: 30px;
                    color: #EEE;
                    background: #2C8250;
                    font-size: 20px;
                    font-weight: bold;
                    padding: 0.6em;
                    border-radius: 0.6em;
                    border: solid black 3px;
                    cursor: pointer;
                }
            </style>
            <div id="event-container">
                ${this.events.map(e => `<p>${("[" + e.type + "]").padEnd(8, " ")} ${e.name.padEnd(14, " ")} | ${JSON.stringify(e.data)}</p>`)}
            </div>
            <button onclick="reportBug()" class="report">Report Bug</button>`
        )
    }
}