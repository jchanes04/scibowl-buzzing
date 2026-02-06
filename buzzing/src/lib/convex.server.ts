import { ConvexHttpClient } from 'convex/browser';
import { env } from '$env/dynamic/public';
import { api } from '../../convex/_generated/api';

// Singleton HTTP client for server-side mutations
let httpClient: ConvexHttpClient | null = null;

export function getConvexClient(): ConvexHttpClient {
  if (!httpClient) {
    httpClient = new ConvexHttpClient(env.PUBLIC_CONVEX_URL);
  }
  return httpClient;
}

// Re-export api for convenience
export { api };
