import { Env } from '../types/env';
import { PropertyDoc, UnitDoc } from '../types/cosmos';
import { cosmosQuery, cosmosDelete } from '../connectors/cosmos';
import { enqueueToFileBin } from './file-bin';
import { recordConcern } from './concerns';

export async function cleanupDraftResources(env: Env): Promise<{ propertiesDeleted: number; unitsDeleted: number }> {
  const ttlDays = parseInt(env.DRAFT_RESOURCE_TTL_DAYS || '30', 10);
  const cutoffTime = new Date(Date.now() - ttlDays * 86400 * 1000).toISOString();

  const staleProperties = await cosmosQuery<PropertyDoc>(
    env,
    'Properties',
    (p) => (p.status === 'draft' || p.status === 'pending_payment') && p.createdAt <= cutoffTime,
    50
  );

  let propertiesDeleted = 0;
  let unitsDeleted = 0;

  for (const prop of staleProperties) {
    if (prop.videoKey) {
      await enqueueToFileBin(env, prop.videoKey, 'videoKey', 'property', prop.id, prop.landlordId);
    }

    const units = await cosmosQuery<UnitDoc>(env, 'Units', (u) => u.propertyId === prop.id, 100);
    for (const u of units) {
      for (const k of u.imageKeys || []) {
        await enqueueToFileBin(env, k, 'imageKeys', 'unit', u.id, u.landlordId);
      }
      await cosmosDelete(env, 'Units', u.country, u.id);
      unitsDeleted++;
    }

    await cosmosDelete(env, 'Properties', prop.country, prop.id);
    await recordConcern(env, {
      accountId: prop.landlordId,
      docId: prop.id,
      reason: 'property_draft_expired_deleted',
      metadata: { createdAt: prop.createdAt, deletedAt: new Date().toISOString() },
    });
    propertiesDeleted++;
  }

  return { propertiesDeleted, unitsDeleted };
}
