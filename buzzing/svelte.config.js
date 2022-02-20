import * as preprocess from 'svelte-preprocess';
import node from '@sveltejs/adapter-node'
import key from './localhost-key.js'
import cert from './localhost.js'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess.default(),

	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		adapter: node(),
		files: {
			lib: "src/lib"
		},
		vite: {
			server: {
				https: {
					key,
					cert   
				}
			}
		}
	}
};

export default config;
