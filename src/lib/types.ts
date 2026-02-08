export interface OpalParameter {
	name: string;
	type: 'string' | 'number' | 'boolean';
	required: boolean;
	description: string;
}

export interface OpalFunction {
	name: string;
	description: string;
	endpoint: string;
	http_method: string;
	parameters: OpalParameter[];
}

export interface DiscoveryResponse {
	functions: OpalFunction[];
}

export interface ToolExecutionResult {
	status: number;
	headers: Record<string, string>;
	body: unknown;
	duration: number;
	requestSize?: number;
	error?: string;
}
