// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare namespace NodeJS {
	interface ProcessEnv {
		OPAL_DISCOVERY_URL?: string;
		OPAL_BEARER_TOKEN?: string;
		PORT?: string;
	}
}

export {};
