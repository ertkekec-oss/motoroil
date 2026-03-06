import { MailPayload, MailProvider } from "../index";

export class MockMailProvider implements MailProvider {
    name = 'MOCK';

    async send(payload: MailPayload): Promise<{ messageId?: string; error?: string }> {
        console.log(`[MOCK EMAIL SEND] Sending to: ${payload.to}`);
        console.log(`[MOCK EMAIL SEND] Subject: ${payload.subject}`);
        console.log(`[MOCK EMAIL SEND] Tenant ID: ${payload.tenantId}`);

        // Simulate a brief network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // For testing purposes, we randomly simulate an error if the subject contains 'MOCK_ERROR'
        if (payload.subject.includes('MOCK_ERROR')) {
            return { error: 'Simulated mock error triggered.' };
        }

        return { messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}` };
    }
}
