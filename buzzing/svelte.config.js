import { vitePreprocess } from '@sveltejs/kit/vite';
import node from '@sveltejs/adapter-node'
import { fileURLToPath } from "url"
import { dirname } from 'path'

const filePath = fileURLToPath(import.meta.url)
const dirPath = dirname(filePath)

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: vitePreprocess({
		style: {
			resolve: {
				alias: {
					"$styles": `${dirPath}/src/lib/styles`,
					"$styles/": `${dirPath}/src/lib/styles/`
				}
			}
		}
	}),

	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		adapter: node(),
		files: {
			lib: "src/lib"
		}
	}
};

export default config;
