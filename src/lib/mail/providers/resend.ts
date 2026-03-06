import { MailPayload, MailProvider } from "../index";

export class ResendMailProvider implements MailProvider {
    name = 'RESEND';

    async send(payload: MailPayload): Promise<{ messageId?: string; error?: string }> {
        try {
            if (!process.env.RESEND_API_KEY) {
                throw new Error('Resend API Key is not configured.');
            }

            console.log(`[RESEND API] Sending email to ${payload.to}`);

            // await resend.emails.send({
            //   from: process.env.MAIL_FROM || 'no-reply@periodya.com',
            //   to: [payload.to],
            //   cc: payload.cc,
            //   bcc: payload.bcc,
            //   subject: payload.subject,
            //   html: payload.html || '',
            //   text: payload.text || '',
            // });

            // Simulate Resend Response
            return { messageId: `resend_${Date.now()}` };
        } catch (error: any) {
            return { error: error.message || 'Unknown Resend error' };
        }
    }
}
