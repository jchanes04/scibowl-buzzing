import EventEmitter from "events"

export interface Timer {
    time: number,
    interval: any
}

export class Timer extends EventEmitter {
    constructor () {
        super()
        this.time = 0
        this.interval = undefined
    }

    start(length: number) {
        if (this.interval) clearInterval(this.interval)

        this.interval = setInterval(() => {
            this.time = this.time + 1
            console.log(this.time)
            if (this.time == length){
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

    end(){
        this.time = 0 
        clearInterval(this.interval)
        this.emit('end')
    }
}