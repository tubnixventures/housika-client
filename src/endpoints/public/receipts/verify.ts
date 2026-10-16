import { Env } from '../../../types/env';
import { ReceiptDoc } from '../../../types/cosmos-extra';
import { cosmosRead } from '../../../connectors/cosmos';
import { jsonOk } from '../../../helpers/response';
import { base64urlDecode, hmacSha256, timingSafeEqual } from '../../../utils/crypto';
import { checkRateLimit } from '../../../middlewares/rate-limit';

export async function handleReceiptVerify(req: Request, env: Env): Promise<Response> {
  const ip = req.headers.get('cf-connecting-ip') || 'anonymous_ip';
  await checkRateLimit(env, `rl:ip:${ip}:rcpt_verify`, 20, 60);

  const url = new URL(req.url);
  const code = url.searchParams.get('code') || '';
  const secret = env.RECEIPT_VERIFY_SECRET || 'dev_receipt_verify_secret_12345';

  if (!code || !code.includes('.')) {
    return jsonOk({ valid: false }, 'Invalid verification code payload', 200);
  }

  const [payloadB64, sigB64] = code.split('.');
  try {
    const expectedSigHex = await hmacSha256(secret, payloadB64);
    const actualSigBytes = base64urlDecode(sigB64);
    const actualSigHex = Array.from(actualSigBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    if (!timingSafeEqual(expectedSigHex, actualSigHex)) {
      return jsonOk({ valid: false }, 'Invalid verification signature', 200);
    }

    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64)));
    const receipt = await cosmosRead<ReceiptDoc>(env, 'Receipts', '', payload.receiptId);

    if (!receipt || (receipt.verifyCode && receipt.verifyCode !== payload.verifyCode)) {
      return jsonOk({ valid: false }, 'Receipt not found or invalid', 200);
    }

    return jsonOk(
      {
        valid: true,
        receiptId: receipt.id,
        amount: receipt.amount,
        currency: receipt.currency || 'KES',
        issuedAt: receipt.createdAt,
        unitLabel: receipt.unitId,
        paymentMethod: receipt.paymentMethod,
      },
      'Receipt verified successfully',
      200
    );
  } catch {
    return jsonOk({ valid: false }, 'Verification failed', 200);
  }
}
