import { ConvexHttpClient, ConvexClient } from 'convex/browser';
import { env } from '$env/dynamic/public';
import { api } from '../../convex/_generated/api';

// Re-export types for convenience
export type { ConvexClient, ConvexHttpClient };

// Singleton HTTP client for server-side mutations
let httpClient: ConvexHttpClient | null = null;

export function getConvexClient(): ConvexHttpClient {
  if (!httpClient) {
    httpClient = new ConvexHttpClient(env.PUBLIC_CONVEX_URL);
  }
  return httpClient;
}

// Real-time client for server-side subscriptions
let realtimeClient: ConvexClient | null = null;

export function getConvexRealtimeClient(): ConvexClient {
  if (!realtimeClient) {
    realtimeClient = new ConvexClient(env.PUBLIC_CONVEX_URL);
  }
  return realtimeClient;
}

// Re-export api for convenience
export { api };

// Helper type for message creation
export type ChatMessageInput = {
  gameId: string;
  text: string;
  type: "buzz" | "notification" | "warning" | "success";
  target?: string[];
};

/**
 * Add a chat message from server-side code
 */
export async function addChatMessage(message: ChatMessageInput) {
  const convex = getConvexClient();
  return convex.mutation(api.chatMessages.add, message);
}
