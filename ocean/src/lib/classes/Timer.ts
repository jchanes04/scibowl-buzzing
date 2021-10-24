import { EventEmitter } from "events"

export interface Timer extends EventEmitter {
    length: number,
    time: number,
    interval: any,
}

// extending the EventEmitter class allows events to be emitted and listened to with timer.on(...)

export class Timer extends EventEmitter {
    constructor () {
        super()
        this.time = 0
        this.interval = undefined
    }

    start(length: number) {
        if (this.interval) clearInterval(this.interval)

        this.time = length
        this.interval = setInterval(() => {
            this.time = this.time - 1
            console.log(this.time)
            if (this.time == 0){
                this.end()
            }
            this.emit('update', this.time)
        }, 1000)
        this.emit('start', this.time)
    }
    
    pause() {
        if (this.interval) clearInterval(this.interval)
        this.emit('pause', this.time)
    }

    resume() {
        if (this.interval) clearInterval(this.interval)
        if (this.time <= 0) return

        this.interval = setInterval(() => {
            this.time = this.time - 1
            console.log(this.time)
            if (this.time == 0){
                this.end()
            }
            this.emit('update', this.time)
        }, 1000)
        this.emit('resume', this.time)
    }

    end(){
        this.time = 0 
        clearInterval(this.interval)
        this.emit('end')
    }
}