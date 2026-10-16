import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { cosmosQuery } from '../../connectors/cosmos';
import { ChatDoc } from '../../types/cosmos-extra';
import { jsonOk } from '../../helpers/response';

export async function handleChatList(
  req: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25', 10), 100);

  const chats = await cosmosQuery<ChatDoc>(
    env,
    'Chats',
    (c) => c.A === auth.id || c.B === auth.id || c.landlordId === auth.id || c.landlordId === auth.companyId,
    limit
  );

  return jsonOk(chats, 'User chats retrieved', 200, { pageSize: chats.length });
}
