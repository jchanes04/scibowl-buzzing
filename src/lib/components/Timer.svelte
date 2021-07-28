<script lang="ts" context="module">
    import { writable } from 'svelte/store'
    export const time = writable(0)
</script>

<script lang="ts">
    export let style: string = ""
    let interval = null
    let isLive = false

    import { createEventDispatcher, onDestroy } from 'svelte'
    const dispatch = createEventDispatcher()

    export function start(length: number) {
        if (interval) clearInterval(interval)

        isLive = true

        $time = length
        interval = setInterval(() => {
            $time = $time - 1
            console.log($time)
            if ($time <= 0){
                this.end()
                clearInterval(interval)
            }
            dispatch('update', $time)
        }, 1000)
        dispatch('start', $time)
    }
    
    export function pause() {
        if (interval) clearInterval(interval)
        isLive = false
        dispatch('pause', $time)
    }

    export function resume() {
        if (interval) clearInterval(interval)
        if ($time <= 0) return

        isLive = true

        interval = setInterval(() => {
            $time = $time - 1
            console.log($time)
            if ($time <= 0){
                this.end()
            }
            dispatch('update', $time)
        }, 1000)
        dispatch('resume', $time)
    }

    export function end(){
        $time = 0 
        clearInterval(interval)
        dispatch('end')

        isLive = false
    }

    export function reset() {
        $time = 0
        clearInterval(interval)

        isLive = false
    }

    export function live() {
        return isLive
    }
</script>

<h1 style={style}>{'0:' + ($time < 10 ? "0" + $time : $time)}</h1>

<style lang="scss">
    h1 {
        display: grid;
        place-content: center;
    }
</style>