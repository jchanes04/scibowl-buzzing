let visible = $state(false)
let reopenCallback = $state<(() => void) | null>(null)
let leaveCallback = $state<(() => void) | null>(null)

export function showGameInactiveModal(
  onReopen: () => void,
  onLeave: () => void
) {
  visible = true
  reopenCallback = onReopen
  leaveCallback = onLeave
}

export function hideGameInactiveModal() {
  visible = false
  reopenCallback = null
  leaveCallback = null
}

export const gameInactiveModal = {
  get visible() { return visible },
  get reopenCallback() { return reopenCallback },
  get leaveCallback() { return leaveCallback }
}
