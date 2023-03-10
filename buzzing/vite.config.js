import { sveltekit } from "@sveltejs/kit/vite"
import { fileURLToPath } from "url"
import { dirname } from 'path'

const filePath = fileURLToPath(import.meta.url)
const dirPath = dirname(filePath)

const keyPath = "./localhost-key.pem"
const certPath = "./localhost.pem"

/** @type {import('vite').UserConfig} */
const config = {
    plugins: [
        sveltekit(),
        {
            name: "vite:cert-plugin",
            async config() {
                const https = () => ({
                    https: {
                        key: keyPath,
                        cert: certPath,
                    },
                });
                return {
                    server: https(),
                };
            },
        }
    ],
    server: {
        https: true
    },
    resolve: {
        alias: {
            "$styles": `${dirPath}/src/lib/styles`,
            "$styles/": `${dirPath}/src/lib/styles/`
        }
    }
}
export default config