import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Gelen E-Adisyon isteğini Nilvera formatına dönüştürüyoruz
        const nilveraPayload = {
            Bill: {
                BillInfo: {
                    IssueDate: new Date().toISOString(),
                    CurrencyCode: body.currency || "TRY",
                    ExchangeRate: body.exchangeRate || 1,
                    // Eğer önceden açık bir belgeye referans verilmek istenirse (Opsiyonel)
                    // RelatedDocument: { Type: "EFATURA", Code: "" },
                    ValidityPeriod: {
                        StartDate: body.sessionStart || new Date().toISOString(),
                        EndDate: new Date().toISOString()
                    }
                },
                // CompanyInfo: Restoran / Kafe (Biz)
                CompanyInfo: {
                    TaxNumber: "1111111111", 
                    Name: "Örnek Restoran ve Gıda A.Ş.",
                    TaxOffice: "Merkez",
                    Address: "Örnek Mah. Lezzet Sok.",
                    District: "Merkez",
                    City: "İstanbul",
                    Country: "Türkiye"
                },
                // CustomerInfo: Müşteri bilgisi çoğu zaman adisyonda yoktur (Nihai Tüketicidir), ama fatura kesilecekse girilebilir.
                CustomerInfo: {
                    TaxNumber: body.customer?.taxNumber || "11111111111",
                    Name: body.customer?.name || "Nihai Tüketici",
                    TaxOffice: "Yok",
                    Address: "Kayıtlı Adres Yok",
                    District: "Bilinmiyor",
                    City: "Bilinmiyor",
                    Country: "Türkiye"
                },
                // SellerInfo: Masaya hizmet veren Garson ve Masa Numarası (E-Adisyon'un kalbi)
                SellerInfo: {
                    User: body.waiterName || "Kasiyer 1",
                    TableNo: body.tableNo || "Masa-01",
                    Address: "Örnek Mah. Lezzet Sok.",
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
                        UnitType: "C62", // Adet / Porsiyon
                        Price: Number(line.price),
                        KDVPercent: Number(line.vatRate) || 0,
                        KDVTotal: vatAmount
                    };
                }),
                Notes: [
                    `E-Adisyon Fişi - ${body.tableNo || 'Masa'}`,
                    "Mali Değeri Yoktur, Ödeme Öncesi Bilgilendirme Amaçlıdır."
                ]
            }
        };

        // ADIM 1: TASLAK OLUŞTUR
        // const draftRes = await fetch("https://apitest.nilvera.com/ebill/Draft/Create", { ... })

        // ADIM 2: E-GÖNDER (ConfirmAndSend - E-Adisyon)
        // const sendRes = await fetch("https://apitest.nilvera.com/ebill/Draft/ConfirmAndSend", { ... })

        return NextResponse.json({
            success: true,
            message: "E-Adisyon başarıyla oluşturuldu ve masaya iletildi.",
            data: {
                draftId: Math.random().toString(36).substring(7),
                tableNo: body.tableNo,
                payload: nilveraPayload 
            }
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
