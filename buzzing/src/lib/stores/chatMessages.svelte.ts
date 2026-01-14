import { useQuery } from 'convex-svelte';
import { api } from '../../../convex/_generated/api';

export type ChatMessage = {
  _id: string;
  text: string;
  type: "buzz" | "notification" | "warning" | "success";
  timestamp: number;
};

// Store for the subscription parameters
let subscriptionParams = $state<{ gameId: string; memberId: string } | null>(null);

/**
 * Initialize the chat messages subscription
 * Must be called from a component after setupConvex()
 */
export function initChatSubscription(gameId: string, memberId: string) {
  subscriptionParams = { gameId, memberId };
}

/**
 * Clear the subscription (when leaving game)
 */
export function clearChatSubscription() {
  subscriptionParams = null;
}

/**
 * Get the chat messages query result
 * Must be called from a component context
 */
export function useChatMessages() {
  return useQuery(
    api.chatMessages.getForGame,
    () => subscriptionParams ?? 'skip'
  );
}

/**
 * Get the current subscription params (for components that need gameId/memberId)
 */
export function getChatSubscriptionParams() {
  return subscriptionParams;
}

// Legacy default export for backwards compatibility during migration
// This will show deprecation warnings if used
const chatMessagesStore = {
  get value(): ChatMessage[] {
    console.warn('chatMessagesStore.value is deprecated. Use useChatMessages() instead.');
    return [];
  },
  add(_message: Omit<ChatMessage, '_id' | 'timestamp'>) {
    console.warn('chatMessagesStore.add() is deprecated. Use Convex mutation instead.');
  },
  set(_messages: ChatMessage[]) {
    console.warn('chatMessagesStore.set() is deprecated.');
  },
  clear() {
    console.warn('chatMessagesStore.clear() is deprecated. Use clearChatSubscription().');
  },
};

export default chatMessagesStore;
