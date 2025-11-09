export async function sendSms(to: string, message: string) {
  const url = process.env.SMS_API_URL || process.env.SHAPARAK_SMS_URL;
  const apiKey = process.env.SMS_API_KEY || process.env.SHAPARAK_SMS_KEY;
  const sender = process.env.SMS_SENDER || process.env.SHAPARAK_SMS_SENDER;
  if (!url || !apiKey) {
    console.warn('[sms] SMS provider not configured; message:', { to, message });
    return false;
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ to, from: sender, message })
    });
    if (!res.ok) {
      console.error('[sms] provider error', res.status);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[sms] send failed', e);
    return false;
  }
}

export function normalizeIrPhone(input: string) {
  let s = String(input || '').trim();
  s = s.replace(/[^0-9+]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (s.startsWith('0')) s = '+98' + s.slice(1);
  if (!s.startsWith('+')) s = '+98' + s;
  return s;
}

