/**
 * Shared types for Convex-side score data.
 * Mirrors the client types in src/lib/stores/scoreboard.svelte.ts
 */
import type { Member, Team } from "../src/lib/types/members";

export type { Member, Team };

export type Category = 'earth' | 'bio' | 'chem' | 'physics' | 'math' | 'energy';
export type ScoreType = "correct" | "incorrect" | "penalty" | "subbed";

export type TossupScore = {
  playerId: string;
  scoreType: ScoreType;
};

export type QuestionPairScore = {
  category: Category;
  tossup: Record<string, TossupScore>;
  bonus: {
    teamId: string;
    correct: boolean;
  } | null;
};

export type Scores = Record<string, QuestionPairScore>;
