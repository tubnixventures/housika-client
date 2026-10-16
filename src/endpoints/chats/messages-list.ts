import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { cosmosQuery, cosmosRead } from '../../connectors/cosmos';
import { ChatDoc, MessageDoc } from '../../types/cosmos-extra';
import { jsonOk } from '../../helpers/response';
import { notFound, forbidden } from '../../helpers/errors';
import { ErrorCodes } from '../../types/errors';

export async function handleChatMessagesList(
  req: Request,
  env: Env,
  auth: AuthContext,
  chatId: string
): Promise<Response> {
  const chat = await cosmosRead<ChatDoc>(env, 'Chats', '', chatId);
  if (!chat) notFound('Chat not found');

  const isParticipant =
    chat.A === auth.id ||
    chat.B === auth.id ||
    chat.landlordId === auth.id ||
    chat.landlordId === auth.companyId;

  if (!isParticipant) {
    forbidden(ErrorCodes.PERMISSION_DENIED, 'Access denied to this chat');
  }

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);

  const messages = await cosmosQuery<MessageDoc>(
    env,
    'Messages',
    (m) => m.chatId === chatId,
    limit
  );

  return jsonOk(messages, 'Messages retrieved', 200, { pageSize: messages.length });
}
