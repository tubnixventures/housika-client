import { Env } from '../types/env';
import { hmacSha512, timingSafeEqual } from '../utils/crypto';

export interface PaystackInitParams {
  amount: number;
  email: string;
  reference: string;
  currency: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackInitResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export async function initPaystackTransaction(
  env: Env,
  params: PaystackInitParams
): Promise<PaystackInitResult> {
  const secret = env.PAYSTACK_SECRET_KEY;
  const baseUrl = env.PAYSTACK_BASE_URL || 'https://api.paystack.co';

  if (!secret) {
    return {
      authorizationUrl: `https://checkout.paystack.com/${params.reference}`,
      accessCode: `mock_code_${params.reference}`,
      reference: params.reference,
    };
  }

  const res = await fetch(`${baseUrl}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amount,
      email: params.email,
      reference: params.reference,
      currency: params.currency,
      metadata: params.metadata,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Paystack init failed (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as any;
  return {
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  };
}

export async function verifyPaystackSignature(
  secret: string,
  rawBody: string,
  signatureHeader: string
): Promise<boolean> {
  const calculatedHex = await hmacSha512(secret, rawBody);
  return timingSafeEqual(calculatedHex.toLowerCase(), signatureHeader.toLowerCase());
}
