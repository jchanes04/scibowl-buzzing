import { useQuery } from 'convex-svelte';
import { api } from '../../../convex/_generated/api';

export type ChatMessage = {
  _id: string;
  text: string;
  type: "buzz" | "notification" | "warning" | "success";
  timestamp: number;
};

// Subscription parameters
let subscriptionParams = $state<{ gameId: string; memberId: string } | null>(null);

// Private state populated automatically
let _chatMessages = $state<ChatMessage[]>([]);

// Track if subscription is already initialized
let isInitialized = $state(false);

/**
 * Initialize the chat messages subscription
 * Must be called from a component after setupConvex()
 */
export function initChatSubscription(gameId: string, memberId: string) {
  // Only initialize once
  if (isInitialized) return;

  subscriptionParams = { gameId, memberId };
  isInitialized = true;

  // Create single subscription shared via the internal state
  const chatMessagesQuery = useQuery(
    api.chatMessages.getForGame,
    () => subscriptionParams ?? 'skip'
  );

  // Sync query results to state automatically
  $effect(() => {
    if (chatMessagesQuery.data) _chatMessages = chatMessagesQuery.data;
  });
}

/**
 * Clear the subscription (when leaving game)
 */
export function clearChatSubscription() {
  subscriptionParams = null;
  _chatMessages = [];
  isInitialized = false;
}

/**
 * Get the current subscription params (for components that need gameId/memberId)
 */
export function getChatSubscriptionParams() {
  return subscriptionParams;
}

/**
 * Chat messages store - derived from Convex data
 */
export const chatMessagesStore = {
  get value(): ChatMessage[] {
    return _chatMessages;
  }
};

// Re-export simplified interface
export default {
  chatMessagesStore,
  initChatSubscription,
  clearChatSubscription,
  getChatSubscriptionParams
};
