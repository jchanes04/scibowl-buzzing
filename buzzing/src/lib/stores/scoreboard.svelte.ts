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
    api.games.getForGame,
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
  // All mutating methods are deprecated - use Convex mutations instead
  setScores: (_scores: Record<number, QuestionPairScore>) => {
    console.warn('scoreboard.setScores() is deprecated. Scores come from Convex.');
  },
  correctTossup: () => {
    console.warn('scoreboard.correctTossup() is deprecated. Use Convex mutation instead.');
  },
  incorrectTossup: () => {
    console.warn('scoreboard.incorrectTossup() is deprecated. Use Convex mutation instead.');
  },
  penalty: () => {
    console.warn('scoreboard.penalty() is deprecated. Use Convex mutation instead.');
  },
  dead: () => {
    console.warn('scoreboard.dead() is deprecated. Use Convex mutation instead.');
  },
  editTossup: () => {
    console.warn('scoreboard.editTossup() is deprecated. Use Convex mutation instead.');
  },
  correctBonus: () => {
    console.warn('scoreboard.correctBonus() is deprecated. Use Convex mutation instead.');
  },
  incorrectBonus: () => {
    console.warn('scoreboard.incorrectBonus() is deprecated. Use Convex mutation instead.');
  },
  editBonus: () => {
    console.warn('scoreboard.editBonus() is deprecated. Use Convex mutation instead.');
  },
  clear: () => {
    console.warn('scoreboard.clear() is deprecated. Use Convex mutation instead.');
  },
  clearQuestion: () => {
    console.warn('scoreboard.clearQuestion() is deprecated. Use Convex mutation instead.');
  },
  deleteQuestion: () => {
    console.warn('scoreboard.deleteQuestion() is deprecated. Use Convex mutation instead.');
  },
};

export default scoreboardStore;