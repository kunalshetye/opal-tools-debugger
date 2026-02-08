import { openDB, type IDBPDatabase } from 'idb';
import type { ToolPreset } from '$lib/types';

const DB_NAME = 'opal-debugger';
const DB_VERSION = 1;
const STORE_NAME = 'presets';

interface OpalDebuggerDB {
	presets: {
		key: string;
		value: ToolPreset;
		indexes: {
			'by-tool': [string, string];
		};
	};
}

let dbPromise: Promise<IDBPDatabase<OpalDebuggerDB>> | null = null;

function getDB(): Promise<IDBPDatabase<OpalDebuggerDB>> {
	if (!dbPromise) {
		dbPromise = openDB<OpalDebuggerDB>(DB_NAME, DB_VERSION, {
			upgrade(db) {
				const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
				store.createIndex('by-tool', ['discoveryUrl', 'toolName']);
			}
		});
	}
	return dbPromise;
}

export async function getPresetsForTool(
	discoveryUrl: string,
	toolName: string
): Promise<ToolPreset[]> {
	const db = await getDB();
	return db.getAllFromIndex(STORE_NAME, 'by-tool', [discoveryUrl, toolName]);
}

export async function savePreset(preset: ToolPreset): Promise<void> {
	const db = await getDB();
	await db.put(STORE_NAME, preset);
}

export async function deletePreset(id: string): Promise<void> {
	const db = await getDB();
	await db.delete(STORE_NAME, id);
}

export async function updatePreset(
	id: string,
	values: Record<string, string | number | boolean>
): Promise<void> {
	const db = await getDB();
	const existing = await db.get(STORE_NAME, id);
	if (!existing) return;
	existing.values = values;
	existing.updatedAt = new Date().toISOString();
	await db.put(STORE_NAME, existing);
}
