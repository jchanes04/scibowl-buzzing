let visible = $state(false)
let oldMemberId = $state<string | null>(null)
let newMemberId = $state<string | null>(null)

export function showAccountLinkingModal(
  oldId: string,
  newId: string
) {
  visible = true
  oldMemberId = oldId
  newMemberId = newId
}

export function hideAccountLinkingModal() {
  visible = false
  oldMemberId = null
  newMemberId = null
}

export const accountLinkingModal = {
  get visible() { return visible },
  get oldMemberId() { return oldMemberId },
  get newMemberId() { return newMemberId }
}
