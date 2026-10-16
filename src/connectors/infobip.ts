import { Env } from '../types/env';

export interface SendWhatsAppParams {
  toPhone: string;
  messageText: string;
}

export async function sendInfobipWhatsApp(
  env: Env,
  params: SendWhatsAppParams
): Promise<boolean> {
  const apiKey = env.INFOBIP_API_KEY;
  const baseUrl = env.INFOBIP_BASE_URL || 'https://api.infobip.com';

  if (!apiKey || !params.toPhone) {
    console.log(`[Infobip Mock] WhatsApp to ${params.toPhone}: ${params.messageText}`);
    return true;
  }

  try {
    const res = await fetch(`${baseUrl}/whatsapp/1/message/text`, {
      method: 'POST',
      headers: {
        Authorization: `App ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Housika',
        to: params.toPhone,
        content: { text: params.messageText },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('Infobip send error:', err);
    return false;
  }
}
