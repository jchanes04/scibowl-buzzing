function createTimerStore() {
    let time = $state(0);
    let interval: ReturnType<typeof setInterval> | undefined;
    let live = $state(false);
    let ended = $state(false);
    const target = new EventTarget();
  
    function clearTimer() {
      if (interval) {
        clearInterval(interval);
        interval = undefined;
      }
    }
  
    function end() {
      time = 0;
      live = false;
      ended = true;
      clearTimer();
      target.dispatchEvent(new Event("end"));
    }
  
    function stop() {
      time = 0;
      live = false;
      ended = false;
      clearTimer();
      target.dispatchEvent(new Event("end"));
    }
  
    function pause() {
      live = false;
      clearTimer();
      target.dispatchEvent(new Event("pause"));
    }
  
    function start(length: number) {
      time = length;
      live = true;
      ended = false;
      clearTimer();
  
      interval = setInterval(() => {
        time--;
        if (time <= 0) {
          end();
        }
      }, 1000);
      target.dispatchEvent(new Event("start"));
    }
  
    function resume() {
      clearTimer();
      if (time <= 0) return;
  
      live = true;
      interval = setInterval(() => {
        time--;
        if (time <= 0) {
          end();
        }
      }, 1000);
      target.dispatchEvent(new Event("resume"));
    }
  
    return {
      get value() {
        return time;
      },
      get live() {
        return live;
      },
      get ended() {
        return ended;
      },
      dispatchEvent: target.dispatchEvent.bind(target),
      addEventListener: target.addEventListener.bind(target),
      removeEventListener: target.removeEventListener.bind(target),
      start,
      end,
      stop,
      pause,
      resume,
    };
  }
  
  export const timerStore = createTimerStore();
  export const gameClockStore = createTimerStore();