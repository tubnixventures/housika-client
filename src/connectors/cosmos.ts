import { Env } from '../types/env';

const inMemoryStore = new Map<string, Map<string, any>>();

function getContainer(container: string): Map<string, any> {
  if (!inMemoryStore.has(container)) {
    inMemoryStore.set(container, new Map());
  }
  return inMemoryStore.get(container)!;
}

export async function cosmosCreate<T extends { id: string }>(
  _env: Env,
  container: string,
  _partitionKey: string,
  doc: T
): Promise<T> {
  const c = getContainer(container);
  c.set(doc.id, JSON.parse(JSON.stringify(doc)));
  return doc;
}

export async function cosmosRead<T>(
  _env: Env,
  container: string,
  _partitionKey: string,
  id: string
): Promise<T | null> {
  const c = getContainer(container);
  const found = c.get(id);
  return found ? (JSON.parse(JSON.stringify(found)) as T) : null;
}

export async function cosmosUpdate<T extends { id: string }>(
  _env: Env,
  container: string,
  partitionKey: string,
  id: string,
  patch: Partial<T>
): Promise<T | null> {
  const c = getContainer(container);
  const current = c.get(id);
  if (!current) return null;
  const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
  c.set(id, updated);
  return updated as T;
}

export async function cosmosDelete(
  _env: Env,
  container: string,
  _partitionKey: string,
  id: string
): Promise<boolean> {
  const c = getContainer(container);
  return c.delete(id);
}

export async function cosmosQuery<T>(
  _env: Env,
  container: string,
  predicate: (item: any) => boolean,
  limit = 25
): Promise<T[]> {
  const c = getContainer(container);
  const results: T[] = [];
  for (const item of c.values()) {
    if (predicate(item)) {
      results.push(JSON.parse(JSON.stringify(item)));
      if (results.length >= limit) break;
    }
  }
  return results;
}
