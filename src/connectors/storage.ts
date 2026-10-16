import { Env } from '../types/env';
import { generateId } from '../helpers/ids';
import { validationErr } from '../helpers/errors';

export type StoragePurpose = 'unit_image' | 'property_video' | 'chat_attachment';

export async function presignStorageUpload(
  env: Env,
  accountId: string,
  purpose: StoragePurpose,
  contentType: string
): Promise<{ uploadUrl: string; key: string; expiresAt: string }> {
  const allowedPurposes = ['unit_image', 'property_video', 'chat_attachment'];
  if (!allowedPurposes.includes(purpose)) {
    validationErr('Invalid storage upload purpose');
  }

  const ext = contentType.split('/')[1] || 'bin';
  const rand = generateId();
  const key = `${purpose}/${accountId}/${rand}.${ext}`;
  const baseUrl = env.STORAGE_SERVICE_URL || 'https://storage.housika.internal';
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const uploadUrl = `${baseUrl}/upload?key=${encodeURIComponent(key)}&exp=${encodeURIComponent(expiresAt)}`;

  return { uploadUrl, key, expiresAt };
}

export async function deleteStorageBlob(env: Env, key: string): Promise<boolean> {
  const deleteUrl = env.STORAGE_DELETE_URL;
  const deleteKey = env.STORAGE_SERVICE_KEY;
  if (!deleteUrl) {
    console.log(`[Storage Mock] Deleted blob key: ${key}`);
    return true;
  }
  try {
    const res = await fetch(`${deleteUrl}/${encodeURIComponent(key)}`, {
      method: 'DELETE',
      headers: deleteKey ? { Authorization: `Bearer ${deleteKey}` } : {},
    });
    return res.ok;
  } catch (e) {
    console.error('Storage delete failed:', e);
    return false;
  }
}
