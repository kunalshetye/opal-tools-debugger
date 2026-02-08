import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	return json({
		discoveryUrl: env.OPAL_DISCOVERY_URL || '',
		bearerToken: env.OPAL_BEARER_TOKEN || ''
	});
};
