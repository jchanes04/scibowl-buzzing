import * as preprocess from 'svelte-preprocess';
import node from '@sveltejs/adapter-node'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess.default(),

	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		adapter: node({
			env: {
				port: 'PORT'
			}
		}),
		target: '#svelte',
		files: {
			lib: "src/lib"
		}
	}
};

export default config;
