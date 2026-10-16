import { z } from 'zod';
import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { presignStorageUpload } from '../../connectors/storage';
import { jsonOk } from '../../helpers/response';
import { checkRateLimit } from '../../middlewares/rate-limit';

export const StoragePresignSchema = z.object({
  purpose: z.enum(['unit_image', 'property_video', 'chat_attachment']),
  contentType: z.string().min(3),
});

export async function handleStoragePresign(
  req: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  await checkRateLimit(env, `rl:acct:${auth.id}:presign`, 30, 60);

  const body = await req.json();
  const parsed = StoragePresignSchema.parse(body);

  const result = await presignStorageUpload(
    env,
    auth.id,
    parsed.purpose,
    parsed.contentType
  );

  return jsonOk(result, 'Upload URL generated successfully', 200);
}
