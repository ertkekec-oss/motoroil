export type OtpProviderConfigParams = {
    isEnabled: boolean;
    apiUsername?: string | null;
    apiPasswordEncrypted?: string | null;
    sender?: string | null;
    otpTemplate?: string | null;
};

export async function sendNetgsmOtp(config: OtpProviderConfigParams, phone: string, code: string): Promise<{ success: boolean; error?: string; raw?: any; jobId?: string }> {
    if (!config.isEnabled) {
        return { success: false, error: 'Netgsm OTP provider is disabled' };
    }

    if (!config.apiUsername || !config.apiPasswordEncrypted || !config.sender) {
        return { success: false, error: 'Netgsm credentials are not fully configured' };
    }

    // Prepare template
    const template = config.otpTemplate || 'Doğrulama kodunuz: {{code}}';
    const message = template.replace('{{code}}', code);

    // Clean phone number: remove non-numeric, assume Turkish (+90) if 10 digits
    let cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length === 10) {
        cleanedPhone = `90${cleanedPhone}`;
    }

    // Future-ready placeholder: Türkçe karakter (TR character parsing for 1-1 mapping if required by NetGSM schema)
    // Note: NetGSM has strict schemas for OTP usage, so ensure plain simple messages usually.

    try {
        // Implement NetGSM XML POST request (standard basic OTP usage template)
        // Since we cannot run live tests easily, we mock the real XML HTTP call logic that matches NetGSM docs.

        const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<mainbody>
    <header>
        <company>Netgsm</company>
        <usercode>${config.apiUsername}</usercode>
        <password>${config.apiPasswordEncrypted}</password>
        <msgheader>${config.sender}</msgheader>
    </header>
    <body>
        <msg><![CDATA[${message}]]></msg>
        <no>${cleanedPhone}</no>
    </body>
</mainbody>`;

        const response = await fetch('https://api.netgsm.com.tr/sms/send/otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/xml',
            },
            body: xmlBody
        });

        const textResponse = await response.text();
        const firstCode = textResponse.split(' ')[0];

        // XML parsing helper for Netgsm OTP format
        let parsedErrorMsg = textResponse;
        let parsedCode = '';
        const matchCode = textResponse.match(/<code>(.*?)<\/code>/);
        if (matchCode && matchCode[1]) {
            parsedCode = matchCode[1];
        }

        if (textResponse.includes('<error>')) {
            const matchMsg = textResponse.match(/<error>(.*?)<\/error>/);
            if (matchMsg && matchMsg[1]) {
                parsedErrorMsg = matchMsg[1];
            }
        }

        // Netgsm returns <code>0</code> or plain text starting with 00 for success
        if (parsedCode === '0' || firstCode === '00' || textResponse.startsWith('00')) {
            const jobIdMatch = textResponse.match(/<jobID>(.*?)<\/jobID>/);
            const jobId = jobIdMatch ? jobIdMatch[1] : '';
            return { success: true, raw: textResponse, jobId };
        } else {
            return { success: false, error: parsedErrorMsg === textResponse ? `Netgsm API Error: ${textResponse}` : `Netgsm Hatası: ${parsedErrorMsg} ${parsedCode ? '(Kod: ' + parsedCode + ')' : ''}` };
        }
    } catch (error: any) {
        console.error('[NetGSM OTP Error]:', error);
        return { success: false, error: `Connection error: ${error.message}` };
    }
}
