import { Env } from '../types/env';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailParams {
  to: EmailRecipient[];
  subject: string;
  htmlBody: string;
}

export async function sendZeptoEmail(env: Env, params: SendEmailParams): Promise<boolean> {
  const apiKey = env.ZEPTOMAIL_API_KEY;
  const bounce = env.ZEPTOMAIL_BOUNCE_ADDRESS || 'noreply@housika.com';

  if (!apiKey) {
    console.log(`[ZeptoMail Mock] Subject: ${params.subject} -> ${params.to[0]?.email}`);
    return true;
  }

  try {
    const res = await fetch('https://api.zeptomail.com/v1.1/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Zoho-enczapikey ${apiKey}`,
      },
      body: JSON.stringify({
        bounce_address: bounce,
        from: { address: bounce, name: 'Housika' },
        to: params.to.map((r) => ({ email_address: { address: r.email, name: r.name || '' } })),
        subject: params.subject,
        htmlbody: params.htmlBody,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('ZeptoMail send error:', err);
    return false;
  }
}
