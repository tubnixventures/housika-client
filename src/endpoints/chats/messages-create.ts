import { z } from 'zod';
import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { cosmosRead, cosmosCreate, cosmosUpdate } from '../../connectors/cosmos';
import { ChatDoc, MessageDoc } from '../../types/cosmos-extra';
import { generateId } from '../../helpers/ids';
import { jsonOk } from '../../helpers/response';
import { notFound, forbidden } from '../../helpers/errors';
import { checkRateLimit } from '../../middlewares/rate-limit';
import { getCompanyPermissions } from '../../connectors/d1';
import { ErrorCodes } from '../../types/errors';

export const MessageCreateSchema = z.object({
  body: z.string().min(1).max(4000),
  attachmentKeys: z.array(z.string()).max(5).optional(),
});

export async function handleChatMessageCreate(
  req: Request,
  env: Env,
  auth: AuthContext,
  chatId: string
): Promise<Response> {
  await checkRateLimit(env, `rl:acct:${auth.id}:chat_msg`, 60, 60);

  const chat = await cosmosRead<ChatDoc>(env, 'Chats', '', chatId);
  if (!chat) notFound('Chat not found');

  if (auth.accountType === 'company') {
    if (chat.landlordId !== auth.companyId) {
      forbidden(ErrorCodes.PERMISSION_DENIED, 'Company does not own this chat');
    }
    const perms = await getCompanyPermissions(env, auth.companyId!, auth.id);
    if (!perms.includes('company.chats.respond') && auth.role !== 'ceo' && auth.role !== 'root') {
      forbidden(ErrorCodes.PERMISSION_DENIED, 'Missing company.chats.respond privilege');
    }
  } else if (chat.A !== auth.id && chat.B !== auth.id && chat.landlordId !== auth.id) {
    forbidden(ErrorCodes.PERMISSION_DENIED, 'You are not a participant in this chat');
  }

  const payload = await req.json();
  const parsed = MessageCreateSchema.parse(payload);
  const nowIso = new Date().toISOString();

  const msg: MessageDoc = {
    id: generateId('msg'),
    docType: 'message',
    chatId,
    senderId: auth.id,
    body: parsed.body,
    attachmentKeys: parsed.attachmentKeys || [],
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await cosmosCreate(env, 'Messages', chatId, msg);
  await cosmosUpdate(env, 'Chats', chat.propertyId, chatId, { updatedAt: nowIso });

  return jsonOk(msg, 'Message sent successfully', 201);
}
