import { Env } from '../types/env';
import { AuthContext } from '../types/auth';
import { handlePaymentInit } from '../endpoints/payments/init';
import { handlePaymentVerify } from '../endpoints/payments/verify';
import { handlePaymentDetail } from '../endpoints/payments/detail';
import { handleReceiptCreate } from '../endpoints/receipts/create';
import { handleReceiptList } from '../endpoints/receipts/list';
import { handleReceiptDetail } from '../endpoints/receipts/detail';
import { handleChatCreate } from '../endpoints/chats/create';
import { handleChatList } from '../endpoints/chats/list';
import { handleChatMessagesList } from '../endpoints/chats/messages-list';
import { handleChatMessageCreate } from '../endpoints/chats/messages-create';
import { handleStoragePresign } from '../endpoints/storage/presign';
import { handleLandlordDashboard } from '../endpoints/landlord/dashboard';

export async function matchServiceRoutes(
  req: Request,
  env: Env,
  auth: AuthContext,
  path: string
): Promise<Response | null> {
  const method = req.method;
  if (path === '/client/api/v1/payments/init' && method === 'POST') return await handlePaymentInit(req, env, auth);
  if (path.startsWith('/client/api/v1/payments/verify') && method === 'GET') return await handlePaymentVerify(req, env, auth);
  if (path.startsWith('/client/api/v1/payments/') && method === 'GET') {
    const paymentId = path.split('/')[5];
    return await handlePaymentDetail(req, env, auth, paymentId);
  }
  if (path === '/client/api/v1/receipts' && method === 'POST') return await handleReceiptCreate(req, env, auth);
  if (path === '/client/api/v1/receipts' && method === 'GET') return await handleReceiptList(req, env, auth);
  if (path.startsWith('/client/api/v1/receipts/') && method === 'GET') {
    const receiptId = path.split('/')[5];
    return await handleReceiptDetail(req, env, auth, receiptId);
  }
  if (path === '/client/api/v1/chats' && method === 'POST') return await handleChatCreate(req, env, auth);
  if (path === '/client/api/v1/chats' && method === 'GET') return await handleChatList(req, env, auth);
  if (path.startsWith('/client/api/v1/chats/') && path.endsWith('/messages') && method === 'POST') {
    const chatId = path.split('/')[5];
    return await handleChatMessageCreate(req, env, auth, chatId);
  }
  if (path.startsWith('/client/api/v1/chats/') && path.endsWith('/messages') && method === 'GET') {
    const chatId = path.split('/')[5];
    return await handleChatMessagesList(req, env, auth, chatId);
  }
  if (path === '/client/api/v1/storage/presign' && method === 'POST') return await handleStoragePresign(req, env, auth);
  if (path === '/client/api/v1/landlord/dashboard' && method === 'GET') return await handleLandlordDashboard(req, env, auth);
  return null;
}
