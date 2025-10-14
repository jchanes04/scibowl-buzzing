import { sveltekit } from "@sveltejs/kit/vite";
import mkcert from "vite-plugin-mkcert";
import { fileURLToPath } from "url";
import { dirname } from "path";

const filePath = fileURLToPath(import.meta.url);
const dirPath = dirname(filePath);

const keyPath = "./localhost-key.pem";
const certPath = "./localhost.pem";

/** @type {import('vite').UserConfig} */
const config = {
    plugins: [sveltekit(), mkcert()],
    resolve: {
        alias: {
            "$styles": `${dirPath}/src/lib/styles`,
            "$styles/": `${dirPath}/src/lib/styles/`
        }
    }
};
export default config;
