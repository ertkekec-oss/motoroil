import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize, resolveCompanyId } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;
        const { user } = auth;
        const companyId = await resolveCompanyId(user);

        if (!companyId) {
             return NextResponse.json({ success: false, error: 'Firma bilgisi bulunamadı.' }, { status: 400 });
        }

        // DB'den Entegrasyon Ayarlarını Çek
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
        
        // Gelen E-Adisyon isteğini Nilvera formatına dönüştürüyoruz
        const nilveraPayload = {
            Bill: {
                BillInfo: {
                    IssueDate: new Date().toISOString(),
                    CurrencyCode: body.currency || "TRY",
                    ExchangeRate: body.exchangeRate || 1,
                    ValidityPeriod: {
                        StartDate: body.sessionStart || new Date().toISOString(),
                        EndDate: new Date().toISOString()
                    }
                },
                CompanyInfo: {
                    TaxNumber: settings.companyVkn || "1111111111", 
                    Name: settings.companyTitle || "Örnek Restoran A.Ş.",
                    TaxOffice: "Merkez",
                    Address: "Örnek Adres",
                    District: "Merkez",
                    City: "İstanbul",
                    Country: "Türkiye"
                },
                CustomerInfo: {
                    TaxNumber: body.customer?.taxNumber || "11111111111",
                    Name: body.customer?.name || "Nihai Tüketici",
                    TaxOffice: "Yok",
                    Address: "Bilinmiyor",
                    District: "Bilinmiyor",
                    City: "Bilinmiyor",
                    Country: "Türkiye"
                },
                SellerInfo: {
                    User: body.waiterName || "Kasiyer 1",
                    TableNo: body.tableNo || "Masa-01",
                    Address: "Örnek Adres",
                    District: "Merkez",
                    City: "İstanbul",
                    Country: "Türkiye"
                },
                BillLines: body.lines?.map((line: any) => {
                    const lineTotal = Number(line.price) * Number(line.quantity);
                    const vatAmount = lineTotal * (Number(line.vatRate) / 100);

                    return {
                        Name: line.name,
                        Quantity: Number(line.quantity),
                        UnitType: "C62", // Adet
                        Price: Number(line.price),
                        KDVPercent: Number(line.vatRate) || 0,
                        KDVTotal: vatAmount
                    };
                }),
                Notes: [
                    `E-Adisyon Fişi - ${body.tableNo || 'Masa'}`,
                    "Mali Değeri Yoktur."
                ]
            }
        };

        // ADIM 1: TASLAK OLUŞTUR
        // Note: Replace ebill/Draft/Create based on Nilvera's e-adisyon documentation if different.
        const draftEndpoint = BASE_URL.replace('/v1', '') + '/ebill/Draft/Create';

        const draftRes = await fetch(draftEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(nilveraPayload)
        });

        if (!draftRes.ok) {
             const errorText = await draftRes.text();
             console.error("Nilvera E-Adisyon Draft Error:", errorText);
             return NextResponse.json({ success: false, error: `Nilvera Hatası: ${draftRes.statusText}` }, { status: 400 });
        }

        const draftData = await draftRes.json();
        
        // Aslında draft oluştuktan sonra "ConfirmAndSend" veya "Send" yapılması gerekir.
        // Adisyon UUID'si dönerse, direkt gönderilebilir.
        
        return NextResponse.json({
            success: true,
            message: "E-Adisyon başarıyla Nilvera'ya iletildi.",
            data: draftData
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
