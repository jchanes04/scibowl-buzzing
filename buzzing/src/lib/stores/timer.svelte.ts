function createTimerStore() {
    let time = $state(0);
    let interval: ReturnType<typeof setInterval> | undefined;
    let live = $state(false);
    let ended = $state(false);
    let startTime = 0;
    let duration = 0;
    const target = new EventTarget();

    function clearTimer() {
      if (interval) {
        clearInterval(interval);
        interval = undefined;
      }
    }

    function calculateRemainingTime() {
      if (!startTime || !duration) return 0;
      const elapsed = (Date.now() - startTime) / 1000;
      return Math.max(0, Math.floor(duration - elapsed));
    }

    function end() {
      time = 0;
      live = false;
      ended = true;
      startTime = 0;
      duration = 0;
      clearTimer();
      target.dispatchEvent(new Event("end"));
    }

    function stop() {
      time = 0;
      live = false;
      ended = false;
      startTime = 0;
      duration = 0;
      clearTimer();
      target.dispatchEvent(new Event("end"));
    }

    function pause() {
      live = false;
      clearTimer();
      target.dispatchEvent(new Event("pause"));
    }

    function start(startTimeMs: number, durationSec: number) {
      startTime = startTimeMs;
      duration = durationSec;
      time = calculateRemainingTime();
      live = true;
      ended = false;
      clearTimer();

      interval = setInterval(() => {
        time = calculateRemainingTime();
        if (time <= 0) {
          end();
        }
      }, 1000);
      target.dispatchEvent(new Event("start"));
    }

    function setTime(newTime: number) {
      time = newTime;
    }

    function resume() {
      clearTimer();
      if (time <= 0) return;

      live = true;
      interval = setInterval(() => {
        time = calculateRemainingTime();
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
      setTime,
    };
  }

  export const timerStore = createTimerStore();
  export const gameClockStore = createTimerStore();
