// Vite plugin to attach Socket.io to the Vite dev server
// This allows WebSocket connections to share the same port as the web server

import type { Plugin, ViteDevServer } from 'vite'

export function socketIOPlugin(): Plugin {
    return {
        name: 'socket-io-plugin',
        configureServer(server: ViteDevServer) {
            // Only attach if we have an HTTP server
            if (!server.httpServer) {
                console.warn('No HTTP server available for Socket.io attachment')
                return
            }

            // Dynamically import the socket server to avoid SSR issues
            // We need to delay this because the server module uses $lib imports
            server.httpServer.once('listening', async () => {
                try {
                    // Import using the vite server's module loader
                    const { attachSocketIO } = await server.ssrLoadModule('/src/lib/server.ts')
                    attachSocketIO(server.httpServer)
                    console.log('✅ Socket.io attached to Vite dev server')
                } catch (error) {
                    console.error('Failed to attach Socket.io to dev server:', error)
                }
            })
        }
    }
}
