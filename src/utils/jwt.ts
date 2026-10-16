import { JwtClaims } from '../types/auth';
import { base64urlEncode, base64urlDecode, hmacSha256 } from './crypto';

export async function verifyJwt(token: string, secret: string): Promise<JwtClaims> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('MALFORMED_JWT');
  const [headerB64, payloadB64, sigB64] = parts;
  const header = JSON.parse(new TextDecoder().decode(base64urlDecode(headerB64)));
  if (header.alg !== 'HS256') throw new Error('UNSUPPORTED_ALGORITHM');

  const dataToSign = `${headerB64}.${payloadB64}`;
  const expectedSigHex = await hmacSha256(secret, dataToSign);
  const actualSigBytes = base64urlDecode(sigB64);
  const actualSigHex = Array.from(actualSigBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  if (expectedSigHex !== actualSigHex) throw new Error('INVALID_SIGNATURE');

  const payload: JwtClaims = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64)));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now - 30) throw new Error('TOKEN_EXPIRED');
  if (payload.aud && payload.aud !== 'housika-api') throw new Error('INVALID_AUDIENCE');
  return payload;
}

export async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64urlEncode(JSON.stringify(header));
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;
  const sigHex = await hmacSha256(secret, data);
  const bytes = new Uint8Array(sigHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  return `${data}.${base64urlEncode(bytes)}`;
}
