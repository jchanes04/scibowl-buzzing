/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/typescript
// for information about these interfaces
declare namespace App {
	interface Locals {
		authenticated?: boolean,
        gameId?: string,
        gameName?: string,
		memberData?: import('$lib/classes/Member').MemberData
	}

	interface Platform {}

	interface Session {
		authenticated: boolean,
        gameId?: string,
        gameName?: string
	}

	interface Stuff {}
}
