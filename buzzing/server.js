// Custom server entry point for production
// This attaches Socket.io to the Node.js HTTP server running on the same port
// 
// Usage (after building):
//   npm run build
//   npm start
//
// For development, Socket.io is automatically attached via the Vite plugin

import { createServer as createHttpsServer } from 'https'
import { createServer as createHttpServer } from 'http'
import { readFileSync, existsSync } from 'fs'
import { Server } from 'socket.io'
import { handler } from './build/handler.js'

const PORT = process.env.PORT || 3000

// Check for SSL certificates
const useHttps = existsSync('./localhost-key.pem') && existsSync('./localhost.pem')

let server

if (useHttps) {
    server = createHttpsServer({
        key: readFileSync('./localhost-key.pem'),
        cert: readFileSync('./localhost.pem')
    })
    console.log('🔒 Starting HTTPS server with SSL certificates')
} else {
    // Fallback to HTTP for production environments where SSL is handled by reverse proxy
    server = createHttpServer()
    console.log('⚠️  Starting HTTP server (no SSL certificates found)')
}

// Use the SvelteKit handler for all HTTP requests
server.on('request', handler)

// The socket server needs to be initialized by the SvelteKit application
// via importing src/lib/socketServer.ts which will attach to this server
// Since we're in production, the socket server is loaded as part of the first request
// that imports '$lib/server' or '$lib/socketServer'

// For a more direct approach, we need to store the server globally
// so the socket server module can access it
globalThis.__httpServer = server

server.listen(PORT, () => {
    const protocol = useHttps ? 'https' : 'http'
    console.log(`🚀 Server running at ${protocol}://localhost:${PORT}`)
})
