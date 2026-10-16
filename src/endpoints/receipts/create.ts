import { z } from 'zod';
import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { resolveLandlordId } from '../../helpers/landlord-id';
import { ReceiptDoc } from '../../types/cosmos-extra';
import { cosmosCreate } from '../../connectors/cosmos';
import { generateId, generateVerifyCode } from '../../helpers/ids';
import { base64urlEncode, hmacSha256 } from '../../utils/crypto';
import { jsonOk } from '../../helpers/response';

export const ReceiptCreateSchema = z.object({
  tenantName: z.string().min(1),
  tenantPhone: z.string().optional(),
  amount: z.number().int().positive(),
  balance: z.number().int().nonnegative().default(0),
  paymentMethod: z.string().default('paystack'),
  nextDue: z.string().optional(),
  unitId: z.string().optional(),
  propertyId: z.string().optional(),
  bookingId: z.string().optional(),
  currency: z.string().default('KES'),
});

export async function handleReceiptCreate(
  req: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const landlordId = resolveLandlordId(auth);
  const body = await req.json();
  const parsed = ReceiptCreateSchema.parse(body);

  const receiptId = generateId('rcpt');
  const verifyCode = generateVerifyCode();
  const nowIso = new Date().toISOString();

  const receiptDoc: ReceiptDoc = {
    id: receiptId,
    docType: 'receipt',
    landlordId,
    tenantName: parsed.tenantName,
    tenantPhone: parsed.tenantPhone,
    amount: parsed.amount,
    balance: parsed.balance,
    paymentMethod: parsed.paymentMethod,
    nextDue: parsed.nextDue || null,
    unitId: parsed.unitId,
    propertyId: parsed.propertyId,
    bookingId: parsed.bookingId,
    verifyCode,
    currency: parsed.currency,
    createdAt: nowIso,
  };

  await cosmosCreate(env, 'Receipts', landlordId, receiptDoc);

  const secret = env.RECEIPT_VERIFY_SECRET || 'dev_receipt_verify_secret_12345';
  const payloadB64 = base64urlEncode(JSON.stringify({ receiptId, verifyCode }));
  const sigHex = await hmacSha256(secret, payloadB64);
  const sigBytes = new Uint8Array(sigHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const signedQrCode = `${payloadB64}.${base64urlEncode(sigBytes)}`;

  return jsonOk(
    { ...receiptDoc, signedQrCode },
    'Receipt issued successfully',
    201
  );
}
