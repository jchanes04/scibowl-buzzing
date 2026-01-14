import { useQuery } from 'convex-svelte';
import { api } from '../../../convex/_generated/api';
import type { QuestionPairScore } from "$lib/classes/GameScoreboard";

// Store for the subscription parameter
let subscriptionGameId = $state<string | null>(null);

/**
 * Initialize the scoreboard subscription
 * Must be called from a component after setupConvex()
 */
export function initScoreboardSubscription(gameId: string) {
  subscriptionGameId = gameId;
}

/**
 * Clear the subscription (when leaving game)
 */
export function clearScoreboardSubscription() {
  subscriptionGameId = null;
}

/**
 * Get the scoreboard query result
 * Must be called from a component context
 */
export function useScoreboard() {
  return useQuery(
    api.scoreboard.getForGame,
    () => subscriptionGameId ? { gameId: subscriptionGameId } : 'skip'
  );
}

// Read-only store interface matching the old API
const scoreboardStore = {
  get value(): Record<number, QuestionPairScore> {
    console.warn('scoreboard.value is deprecated. Use useScoreboard() instead.');
    return {};
  },
  get pointValues() {
    console.warn('scoreboard.pointValues is deprecated. Use useScoreboard() instead.');
    return { tossup: 4, bonus: 10, penalty: -4 };
  },
};

export default scoreboardStore;