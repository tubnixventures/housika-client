import { z } from 'zod';
import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { PropertyDoc, UnitDoc } from '../../types/cosmos';
import { ChatDoc, MessageDoc } from '../../types/cosmos-extra';
import { cosmosRead, cosmosCreate, cosmosQuery } from '../../connectors/cosmos';
import { generateId } from '../../helpers/ids';
import { jsonOk } from '../../helpers/response';
import { notFound, validationErr } from '../../helpers/errors';

export const ChatCreateSchema = z.object({
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  initialMessage: z.string().max(4000).optional(),
});

export async function handleChatCreate(
  req: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const body = await req.json();
  const parsed = ChatCreateSchema.parse(body);
  if (!parsed.propertyId && !parsed.unitId) {
    validationErr('At least one of propertyId or unitId is required to start a chat');
  }

  let landlordId = '';
  let propertyId = parsed.propertyId || '';

  if (parsed.unitId) {
    const unit = await cosmosRead<UnitDoc>(env, 'Units', '', parsed.unitId);
    if (!unit) notFound('Unit not found');
    landlordId = unit.landlordId;
    propertyId = unit.propertyId;
  } else if (parsed.propertyId) {
    const prop = await cosmosRead<PropertyDoc>(env, 'Properties', '', parsed.propertyId);
    if (!prop) notFound('Property not found');
    landlordId = prop.landlordId;
  }

  const existing = await cosmosQuery<ChatDoc>(
    env,
    'Chats',
    (c) =>
      c.propertyId === propertyId &&
      ((c.A === auth.id && c.B === landlordId) || (c.A === landlordId && c.B === auth.id)),
    1
  );

  const nowIso = new Date().toISOString();
  let chat = existing[0];

  if (!chat) {
    chat = {
      id: generateId('chat'),
      docType: 'chat',
      propertyId,
      unitId: parsed.unitId,
      landlordId,
      A: auth.id,
      B: landlordId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await cosmosCreate(env, 'Chats', propertyId, chat);
  }

  if (parsed.initialMessage) {
    const msg: MessageDoc = {
      id: generateId('msg'),
      docType: 'message',
      chatId: chat.id,
      senderId: auth.id,
      body: parsed.initialMessage,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await cosmosCreate(env, 'Messages', chat.id, msg);
  }

  return jsonOk(chat, 'Chat initiated successfully', 201);
}
