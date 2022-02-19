/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/typescript
// for information about these interfaces
declare namespace App {
	interface Locals {
		userData: import('$lib/mongo').UserClean
	}

	interface Platform {}

	interface Session {
		loggedIn: boolean,
		userData: import('$lib/mongo').UserClean
	}

	interface Stuff {}
}
