import { sveltekit } from "@sveltejs/kit/vite"

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
    }
}
export default config