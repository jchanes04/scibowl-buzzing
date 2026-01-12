import { sveltekit } from "@sveltejs/kit/vite"
import { fileURLToPath } from "url"
import { dirname } from 'path'
import fs from 'fs'

const filePath = fileURLToPath(import.meta.url)
const dirPath = dirname(filePath)

const keyPath = "./localhost-key.pem"
const certPath = "./localhost.pem"

/** @type {import('vite').UserConfig} */
const config = {
    plugins: [
        sveltekit()
    ],
    server: {
        https: {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
        },
        proxy: {},  // Empty proxy disables HTTP/2, fixing the undici headers issue
        fs: {
            allow: ['./convex']
        }
    },
    resolve: {
        alias: {
            "$styles": `${dirPath}/src/lib/styles`,
            "$styles/": `${dirPath}/src/lib/styles/`
        }
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler'
            }
        }
    }
}
export default config