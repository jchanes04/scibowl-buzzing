import { useQuery } from 'convex-svelte';
import { api } from '../../../convex/_generated/api';
import type { QuestionPairScore } from "$lib/classes/GameScoreboard";

type ScoreboardData = {
  scores: Record<number, QuestionPairScore>;
  pointValues: {
    tossup: number;
    bonus: number;
    penalty: number;
  };
  isActive: boolean;
};

// Subscription parameter
let subscriptionGameId = $state<string | null>(null);

// Private state populated automatically
let _scoreboard = $state<ScoreboardData>({
  scores: {},
  pointValues: { tossup: 4, bonus: 10, penalty: -4 },
  isActive: true
});

// Track if subscription is already initialized
let isInitialized = $state(false);

/**
 * Initialize the scoreboard subscription
 * Must be called from a component after setupConvex()
 */
export function initScoreboardSubscription(gameId: string) {
  // Only initialize once
  if (isInitialized) return;

  subscriptionGameId = gameId;
  isInitialized = true;

  // Create single subscription shared via the internal state
  const scoreboardQuery = useQuery(
    api.games.getScoreboard,
    () => subscriptionGameId ? { gameId: subscriptionGameId } : 'skip'
  );

  // Sync query results to state automatically
  $effect(() => {
    if (scoreboardQuery.data) _scoreboard = scoreboardQuery.data;
  });
}

/**
 * Clear the subscription (when leaving game)
 */
export function clearScoreboardSubscription() {
  subscriptionGameId = null;
  _scoreboard = {
    scores: {},
    pointValues: { tossup: 4, bonus: 10, penalty: -4 },
    isActive: true
  };
  isInitialized = false;
}

/**
 * Scoreboard store - derived from Convex data
 */
export const scoreboardStore = {
  get value(): ScoreboardData {
    return _scoreboard;
  },
  get isActive(): boolean {
    return _scoreboard.isActive;
  }
};

// Re-export simplified interface
export default {
  scoreboardStore,
  initScoreboardSubscription,
  clearScoreboardSubscription
};