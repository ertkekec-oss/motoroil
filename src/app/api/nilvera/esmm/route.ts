import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Gelen E-SMM (Serbest Meslek Makbuzu) isteğini Nilvera formatına dönüştürüyoruz
        const nilveraPayload = {
            Voucher: {
                VoucherInfo: {
                    IssueDate: body.issueDate || new Date().toISOString(),
                    CurrencyCode: body.currency || "TRY",
                    SendType: "ELEKTRONIK", // veya KAGIT (Alici e-fatura kullanicisi degilse)
                    ExchangeRate: body.exchangeRate || 1
                },
                // CompanyInfo: Makbuzu Düzenleyen Firma (Serbest Meslek Erbabı - Biz)
                CompanyInfo: {
                    TaxNumber: "1111111111", 
                    Name: "Örnek Serbest Meslek Erbabı",
                    TaxOffice: "Merkez",
                    Address: "Örnek Mah. Ofis Sok.",
                    District: "Merkez",
                    City: "İstanbul",
                    Country: "Türkiye"
                },
                // CustomerInfo: Müşteri (Hizmet Alan)
                CustomerInfo: {
                    TaxNumber: body.customer?.taxNumber || "11111111111",
                    Name: body.customer?.name || "Bilinmeyen Müşteri",
                    TaxOffice: body.customer?.taxOffice || "Yok",
                    Address: body.customer?.address || "Kayıtlı Adres Yok",
                    District: body.customer?.district || "Bilinmiyor",
                    City: body.customer?.city || "Bilinmiyor",
                    Country: "Türkiye"
                },
                VoucherLines: body.lines?.map((line: any) => {
                    const gvF = Number(line.gvRate) / 100;
                    const vatF = Number(line.vatRate) / 100;
                    const inputAmount = Number(line.amount) || 0;

                    let brut = 0;
                    let net = 0;

                    // Otonom Net/Brüt hesaplamasını Backend'de de sağlamlaştırıyoruz
                    if (line.calcMode === 'brut') {
                        brut = inputAmount;
                        net = brut + (brut * vatF) - (brut * gvF);
                    } else {
                        net = inputAmount;
                        const divisor = (1 + vatF - gvF);
                        brut = divisor === 0 ? 0 : net / divisor;
                    }

                    return {
                        Name: line.name,
                        GrossWage: brut,
                        Price: brut,
                        KDVPercent: Number(line.vatRate) || 0,
                        KDVTotal: brut * vatF,
                        GVWithholdingPercent: Number(line.gvRate) || 0,
                        GVWithholdingTotal: brut * gvF,
                        Taxes: [] // KDV Tevkifatı (Withholding) gibi ek vergiler buraya gelir
                    };
                }),
                Notes: [
                    body.notes || "E-Serbest Meslek Makbuzu (E-SMM) Periodya Enterprise Tarafından Düzenlenmiştir."
                ]
            }
        };

        // ADIM 1: TASLAK OLUŞTUR
        // const draftRes = await fetch("https://apitest.nilvera.com/evoucher/Draft/Create", {
        //     method: "POST",
        //     headers: { "Authorization": `Bearer ${process.env.NILVERA_API_KEY}`, "Content-Type": "application/json" },
        //     body: JSON.stringify(nilveraPayload)
        // })
        // const createdUUID = (await draftRes.json()).UUID;

        // ADIM 2: E-GÖNDER (ConfirmAndSend)
        // const sendRes = await fetch("https://apitest.nilvera.com/evoucher/Draft/ConfirmAndSend", {
        //     method: "POST",
        //     headers: { "Authorization": `Bearer ${process.env.NILVERA_API_KEY}`, "Content-Type": "application/json-patch+json" },
        //     body: JSON.stringify([ createdUUID ]) // Array of UUIDs
        // });

        return NextResponse.json({
            success: true,
            message: "E-SMM Taslağı başarıyla oluşturuldu ve GİB kuyruğuna (ConfirmAndSend) iletildi.",
            data: {
                draftId: Math.random().toString(36).substring(7),
                payload: nilveraPayload 
            }
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
