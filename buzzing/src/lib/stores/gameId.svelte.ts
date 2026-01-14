/**
 * Store for the current game ID
 * Used by components to access the game ID for Convex mutations
 */
let gameId = $state<string | null>(null);

const gameIdStore = {
  get value() {
    return gameId;
  },
  set(id: string) {
    gameId = id;
  },
  clear() {
    gameId = null;
  },
};

export default gameIdStore;
