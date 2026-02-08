export interface StatusInfo {
	label: string;
	category: 'success' | 'redirect' | 'client-error' | 'server-error' | 'network-error';
	bgColor: string;
	textColor: string;
	badgeBg: string;
}

const STATUS_LABELS: Record<number, string> = {
	200: '200 OK',
	201: '201 Created',
	204: '204 No Content',
	301: '301 Moved Permanently',
	302: '302 Found',
	304: '304 Not Modified',
	400: '400 Bad Request',
	401: '401 Unauthorized',
	403: '403 Forbidden',
	404: '404 Not Found',
	405: '405 Method Not Allowed',
	408: '408 Request Timeout',
	409: '409 Conflict',
	422: '422 Unprocessable Entity',
	429: '429 Too Many Requests',
	500: '500 Internal Server Error',
	502: '502 Bad Gateway',
	503: '503 Service Unavailable',
	504: '504 Gateway Timeout'
};

export function getStatusInfo(status: number, error?: string): StatusInfo {
	if (error || status === 0) {
		return {
			label: error ? `Network Error` : 'Error',
			category: 'network-error',
			bgColor: 'bg-purple-600',
			textColor: 'text-purple-400',
			badgeBg: 'bg-purple-500/20'
		};
	}

	const label = STATUS_LABELS[status] || `${status}`;

	if (status >= 200 && status < 300) {
		return {
			label,
			category: 'success',
			bgColor: 'bg-emerald-600',
			textColor: 'text-emerald-400',
			badgeBg: 'bg-emerald-500/20'
		};
	}

	if (status >= 300 && status < 400) {
		return {
			label,
			category: 'redirect',
			bgColor: 'bg-blue-600',
			textColor: 'text-blue-400',
			badgeBg: 'bg-blue-500/20'
		};
	}

	if (status >= 400 && status < 500) {
		return {
			label,
			category: 'client-error',
			bgColor: 'bg-amber-600',
			textColor: 'text-amber-400',
			badgeBg: 'bg-amber-500/20'
		};
	}

	return {
		label,
		category: 'server-error',
		bgColor: 'bg-red-600',
		textColor: 'text-red-400',
		badgeBg: 'bg-red-500/20'
	};
}
