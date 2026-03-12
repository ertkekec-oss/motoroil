import { NextResponse } from 'next/server';
import { NilveraInvoiceService } from '@/services/nilveraService';
import prisma from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const vkn = searchParams.get('vkn') || '6231776841';

        // Fetch company info (VKN, name, address etc.) - just get first for testing
        const company = await prisma.company.findFirst();

        if (!company) return NextResponse.json({ error: 'No company' });

        let nilveraApiKey = '';
        let nilveraBaseUrl = 'https://apitest.nilvera.com';
        let config: any = {};

        const intSettings = await (prisma as any).integratorSettings.findFirst({
            where: { isActive: true }
        });

        if (intSettings && intSettings.credentials) {
            try {
                const creds = JSON.parse(decrypt(intSettings.credentials));
                nilveraApiKey = (creds.apiKey || creds.ApiKey || '').trim();
                nilveraBaseUrl = (intSettings.environment === 'PRODUCTION')
                    ? 'https://api.nilvera.com'
                    : 'https://apitest.nilvera.com';
                config = creds;
            } catch (e) {
                console.warn('[Test] Failed to decrypt');
            }
        }

        if (!nilveraApiKey) {
            const settingsRecord = await prisma.appSettings.findUnique({
                where: { companyId_key: { companyId: company.id, key: 'eFaturaSettings' } }
            });
            config = (settingsRecord?.value as any) || {};
            nilveraApiKey = (config.apiKey || '').trim();
            nilveraBaseUrl = (config.environment?.toLowerCase() === 'production')
                ? 'https://api.nilvera.com'
                : 'https://apitest.nilvera.com';
        }

        const svc = new NilveraInvoiceService({ apiKey: nilveraApiKey, baseUrl: nilveraBaseUrl });

        const invCheck = await svc.checkTaxpayer(vkn);
        const despCheck = await svc.checkDespatchTaxpayer(vkn);
        const companyInfo = await svc.getCompanyInfo();

        return NextResponse.json({
            vkn: vkn,
            baseUrl: nilveraBaseUrl,
            apiKeyPrefix: nilveraApiKey.substring(0, 10),
            invCheck,
            despCheck,
            companyInfo,
        });

    } catch(e: any) {
        return NextResponse.json({ error: e.message });
    }
}
