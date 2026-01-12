import { ConvexHttpClient, ConvexClient } from "convex/browser";
import { env } from '$env/dynamic/public';

const url = env.PUBLIC_CONVEX_URL // Fallback or throw?
console.log("Convex URL being used:", url);

if (!url) {
    console.warn("CONVEX_URL is not defined.");
}

// HTTP client for simple mutations/queries (no subscriptions)
export const convex = new ConvexHttpClient(url!);

// WebSocket client for subscriptions (used by server for reactive player/team updates)
export const convexSubscription = new ConvexClient(url!);
