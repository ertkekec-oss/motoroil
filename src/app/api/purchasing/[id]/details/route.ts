import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { NilveraInvoiceService } from '@/services/nilveraService';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        const companyId = session.user?.companyId || session.companyId;

        let apiKey = '';
        let baseUrl = '';

        const intSettings = await (prisma as any).integratorSettings.findFirst({
            where: { companyId, isActive: true }
        });

        if (intSettings?.credentials) {
            try {
                const { decrypt } = await import('@/lib/encryption');
                const creds = JSON.parse(decrypt(intSettings.credentials));
                apiKey = (creds.apiKey || creds.ApiKey || '').trim();
                baseUrl = (intSettings.environment === 'PRODUCTION')
                    ? 'https://api.nilvera.com'
                    : 'https://apitest.nilvera.com';
            } catch (e) { }
        }

        if (!apiKey) {
            const settingsRecord = await prisma.appSettings.findUnique({
                where: { companyId_key: { companyId, key: 'eFaturaSettings' } }
            });
            const rawConfig = settingsRecord?.value as any;
            const config = rawConfig?.apiKey ? rawConfig : (rawConfig?.nilvera || {});
            apiKey = config?.apiKey;
            baseUrl = config?.environment === 'production' ? 'https://api.nilvera.com' : 'https://apitest.nilvera.com';
        }

        if (!apiKey) return NextResponse.json({ error: 'Nilvera ayarları bulunamadı' }, { status: 400 });

        const nilvera = new NilveraInvoiceService({
            apiKey,
            baseUrl: baseUrl || 'https://apitest.nilvera.com'
        });

        const type = new URL(req.url).searchParams.get('type');
        let result: any = null;

        if (type === 'DESPATCH') {
            result = await nilvera.getDespatchDetails(params.id);
        } else {
            result = await nilvera.getInvoiceDetails(params.id);
            if (!result.success) {
               result = await nilvera.getDespatchDetails(params.id);
            }
        }

        if (!result || !result.success) {
            return NextResponse.json({ error: result?.error || 'Bulunamadı' }, { status: 404 });
        }

        const data = result.data;
        let items = [];
        
        if (data.EDespatch?.DespatchLines) items = data.EDespatch.DespatchLines;
        else if (data.DespatchLines) items = data.DespatchLines;
        else if (data.InvoiceLines) items = data.InvoiceLines;
        else if (data.Model?.DespatchLines) items = data.Model.DespatchLines;
        else if (data.Model?.InvoiceLines) items = data.Model.InvoiceLines;
        
        return NextResponse.json({ success: true, items });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
