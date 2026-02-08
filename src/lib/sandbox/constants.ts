export const SANDBOX_URL = 'sandbox://local';

export function isSandboxMode(discoveryUrl: string): boolean {
	return discoveryUrl === SANDBOX_URL;
}
