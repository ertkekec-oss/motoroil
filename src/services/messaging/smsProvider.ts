export interface SmsProvider {
    sendSms(to: string, message: string, metadata?: Record<string, any>): Promise<{ providerMessageId: string }>;
}

export class DevConsoleSmsProvider implements SmsProvider {
    async sendSms(to: string, message: string, metadata?: Record<string, any>) {
        console.log(`\n\n[DEV SMS PROVIDER] To: ${to}\n[MESSAGE]: ${message}\n[METADATA]: ${JSON.stringify(metadata || {})}\n\n`);
        return { providerMessageId: `dev-sms-${Date.now()}` };
    }
}

export class NetgsmSmsProvider implements SmsProvider {
    async sendSms(to: string, message: string, metadata?: Record<string, any>) {
        // Implementation stub for actual HTTP request to NetGsm / API route based provider
        // e.g. using fetch to netgsm endpoint with usercode/password credentials
        console.log(`[NETGSM STUB] Sending real HTTP request to: ${to}`);
        return { providerMessageId: `netgsm-${Date.now()}` };
    }
}

export function getSmsProvider(): SmsProvider {
    const isProd = process.env.NODE_ENV === 'production';
    const netgsmEnabled = process.env.SMS_PROVIDER === 'netgsm';

    // Fallback logic
    if (isProd && netgsmEnabled) {
        return new NetgsmSmsProvider();
    }
    return new DevConsoleSmsProvider();
}
