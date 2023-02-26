import { writable } from "svelte/store";

function createTimerStore() {
    const timeStore = writable(0)
    let time = 0
    let interval: NodeJS.Timer
    let live = false
    let ended = false
    const target = new EventTarget()

    return {
        dispatchEvent: target.dispatchEvent.bind(target),
        addEventListener: target.addEventListener.bind(target),
        removeEventListener: target.removeEventListener.bind(target),
        subscribe: timeStore.subscribe,
        start: function(length: number) {
            timeStore.set(length)
            time = length
            live = true
            ended = false
            if (interval) clearInterval(interval)

            interval = setInterval(() => {
                timeStore.update(t => t - 1)
                time--

                if (time <= 0) {
                    this.end()
                }
            }, 1000)
            this.dispatchEvent(new Event("start"))
        },
        end: function() {
            timeStore.set(0)
            time = 0
            live = false
            ended = true

            if (interval) clearInterval(interval)
            this.dispatchEvent(new Event("end"))
        },
        stop: function() {
            timeStore.set(0)
            time = 0
            live = false
            ended = false

            if (interval) clearInterval(interval)
            this.dispatchEvent(new Event("end"))
        },
        pause: function() {
            live = false
            if (interval) clearInterval(interval)
            this.dispatchEvent(new Event("pause"))
        },
        resume: function() {
            if (interval) clearInterval(interval)
            if (time <= 0) return

            live = true
            interval = setInterval(() => {
                timeStore.update(t => t - 1)
                time--

                if (time <= 0) {
                    this.end()
                }
            }, 1000)
            this.dispatchEvent(new Event("resume"))
        },
        get time() {
            return time
        },
        get live() {
            return live
        },
        get ended() {
            return ended
        }
    }
}

export const timerStore = createTimerStore()
export const gameClockStore = createTimerStore()