/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/typescript
// for information about these interfaces
declare namespace App {
	interface Locals {
        gameId?: string,
        gameName?: string,
		myData?: import('$lib/classes/Player').PlayerData | import('$lib/classes/Moderator').ModeratorData | null
	}

	interface Platform {}

	interface Session {
		authenticated: boolean,
        gameId?: string,
        gameName?: string
	}

	interface Stuff {}
}
