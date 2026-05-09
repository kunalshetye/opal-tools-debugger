export interface OpalParameter {
	name: string;
	type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
	required: boolean;
	description: string;
}

export interface OpalAuthRequirement {
	provider: string;
	scope_bundle: string;
	required: boolean;
}

export interface OpalFunction {
	name: string;
	description: string;
	endpoint: string;
	http_method: string;
	parameters: OpalParameter[];
	auth_requirements?: OpalAuthRequirement[];
	ui_resource?: string;
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
	requestParams?: Record<string, unknown>;
	requestUrl?: string;
	requestMethod?: string;
	requestHeaders?: Record<string, string>;
}

export interface ToolPreset {
	id: string;
	toolName: string;
	discoveryUrl: string;
	presetName: string;
	values: Record<string, unknown>;
	headers?: Record<string, string>;
	createdAt: string;
	updatedAt: string;
}

export type LogLevel = 'info' | 'success' | 'warning' | 'error';
export type LogCategory = 'connection' | 'discovery' | 'execution' | 'app';

export interface LogEntry {
	id: string;
	timestamp: number;
	level: LogLevel;
	category: LogCategory;
	message: string;
	details?: unknown;
	toolName?: string;
}
