/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/typescript
// for information about these interfaces
declare namespace App {
	interface Locals {
		user: import('$lib/mongo').UserClean
	}

	interface Platform {}

	interface PrivateEnv {
		DATABASE_URL: string,
		SENDGRID_API_KEY: string
	}
}
