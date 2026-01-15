// Re-export from socketServer for backward compatibility
// The actual socket server implementation is now in socketServer.ts
// which can be attached to any HTTP server

export {
    games,
    getIO,
    attachSocketIO,
    createNewGame,
    getGame,
    gameExists,
    getGameFromCode
} from './socketServer'

// For backward compatibility with code that imports `io` directly
import { getIO } from './socketServer'
export const io = getIO()