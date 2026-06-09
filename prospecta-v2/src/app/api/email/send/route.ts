// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const { to, toName, fromName, fromEmail, subject, body, prospectId, campaignId } = await req.json();

  if (!to || !subject || !body) {
    return NextResponse.json({ error: 'Champs manquants: to, subject, body requis' }, { status: 400 });
  }

  if (!process.env.BREVO_API_KEY) {
    // Mode démo sans Brevo — simule l'envoi
    const sql = (await import('@/lib/db')).default;
    await sql`
      INSERT INTO email_logs (user_id, campaign_id, prospect_id, to_email, subject, status)
      VALUES (${session.userId}, ${campaignId || null}, ${prospectId || null}, ${to}, ${subject}, 'SENT')
    `;
    return NextResponse.json({ success: true, demo: true, message: 'Email simulé (configurez BREVO_API_KEY pour envoyer réellement)' });
  }

  try {
    const htmlBody = body.includes('<html')
      ? body
      : `<html><body style="font-family:Arial,sans-serif;line-height:1.8;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">${body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</body></html>`;

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: fromName || session.name,
          email: fromEmail || process.env.BREVO_SMTP_USER,
        },
        to: [{ email: to, name: toName || to }],
        subject,
        htmlContent: htmlBody,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: 'Brevo: ' + err }, { status: 500 });
    }

    const data = await res.json();

    // Log in DB
    const sql = (await import('@/lib/db')).default;
    await sql`
      INSERT INTO email_logs (user_id, campaign_id, prospect_id, to_email, subject, status)
      VALUES (${session.userId}, ${campaignId || null}, ${prospectId || null}, ${to}, ${subject}, 'SENT')
    `;

    return NextResponse.json({ success: true, messageId: data.messageId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
