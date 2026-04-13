import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize, resolveCompanyId } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;
        const { user } = auth;
        const companyId = await resolveCompanyId(user);

        if (!companyId) return NextResponse.json({ success: false, error: 'Firma bilgisi bulunamadı.' }, { status: 400 });

        const settingsRecord = await prisma.appSettings.findUnique({
             where: { companyId_key: { companyId, key: 'eFaturaSettings' } }
        });

        const settings = settingsRecord?.value as any || {};
        const API_KEY = settings.apiKey;
        const BASE_URL = settings.apiUrl || 'https://apitest.nilvera.com/v1';

        if (!API_KEY) {
            return NextResponse.json({ success: false, error: 'Nilvera API Key bulunamadı. Lütfen Sistem Entegrasyonları sayfasından API Key giriniz.' }, { status: 400 });
        }

        const body = await req.json();

        // MOCK PAYLOAD FOR SMM
        const nilveraPayload = {
             Voucher: {
                 VoucherInfo: {
                     IssueDate: new Date().toISOString(),
                     CurrencyCode: body.currency || "TRY"
                 },
                 CompanyInfo: {
                     TaxNumber: settings.companyVkn || "1111111111",
                     Name: settings.companyTitle || "Firma A.Ş."
                 },
                 CustomerInfo: {
                     TaxNumber: body.customer?.taxNumber || "11111111111",
                     Name: body.customer?.name || "Serbest Meslek Müşterisi"
                 },
                 VoucherLines: body.lines?.map((line: any) => ({
                     Name: line.name,
                     GrossTotal: Number(line.price || line.amount || 0),
                     KdvPercent: Number(line.vatRate || 20),
                     StoppagePercent: Number(line.gvRate || 20)
                 }))
             }
        };

        const draftEndpoint = BASE_URL.replace('/v1', '') + '/esmm/Draft/Create';

        const res = await fetch(draftEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(nilveraPayload)
        });

        if (!res.ok) {
             const errorText = await res.text();
             return NextResponse.json({ success: false, error: `Nilvera ESMM Hatası: ${res.statusText}` }, { status: 400 });
        }

        const data = await res.json();
        return NextResponse.json({ success: true, message: "E-SMM Nilvera'ya iletildi", data });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

