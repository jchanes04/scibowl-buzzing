<script lang="ts" context="module">
    import { writable } from 'svelte/store'
    export const time = writable(0)
</script>

<script lang="ts">
    let interval = null

    import { createEventDispatcher } from 'svelte'
    const dispatch = createEventDispatcher()

    export function start(length: number) {
        if (interval) clearInterval(interval)

        $time = length
        interval = setInterval(() => {
            $time = $time - 1
            console.log($time)
            if ($time == 0){
                this.end()
            }
            dispatch('update', $time)
        }, 1000)
        dispatch('start', $time)
    }
    
    export function pause() {
        if (interval) clearInterval(interval)
        dispatch('pause', $time)
    }

    export function resume() {
        if (interval) clearInterval(interval)
        if ($time <= 0) return

        interval = setInterval(() => {
            $time = $time - 1
            console.log($time)
            if ($time == 0){
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
    }
</script>

<h1>{'0:' + ($time < 10 ? "0" + $time : $time)}</h1>

<style lang="scss">
    h1 {
        float: right;
    }
</style>