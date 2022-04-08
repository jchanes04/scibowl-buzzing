/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/typescript
// for information about these interfaces
declare namespace App {
	interface Locals {
		userData: import('$lib/mongo').User
	}

	interface Platform {}

	interface Session {
		loggedIn: boolean,
		userData: import('$lib/mongo').User,
		previousQuery?: {
			authorName?: string,
			keywords?: string,
			types?: string[],
			categories?: string[],
			start?: string,
			end?: string
		}
	}

	interface Stuff {}
}
