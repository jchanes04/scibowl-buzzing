import { ConvexHttpClient } from 'convex/browser';
import { env } from '$env/dynamic/public';
import { api } from '../../convex/_generated/api';

// Singleton HTTP client for server-side mutations
let client: ConvexHttpClient | null = null;

export function getConvexClient(): ConvexHttpClient {
  if (!client) {
    client = new ConvexHttpClient(env.PUBLIC_CONVEX_URL);
  }
  return client;
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
