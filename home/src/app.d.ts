/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/typescript
// for information about these interfaces
declare namespace App {
	interface Locals {
		user: import('$lib/mongo').UserClean | null
	}

	interface Platform {}

	interface PublicEnv {
		PUBLIC_HOST_URL: string
	}

	interface PrivateEnv {
		DATABASE_URL: string,
		SENDGRID_API_KEY: string,
		STRIPE_API_KEY: string,
		REGISTRATION_PRICE_ID: string
	}
}
