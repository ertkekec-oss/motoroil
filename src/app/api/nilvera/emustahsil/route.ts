import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Gelen isteği Nilvera E-Müstahsil formatına dönüştürüyoruz
        const nilveraPayload = {
            Producer: {
                ProducerInfo: {
                    DeliveryDate: new Date().toISOString(),
                    IssueDate: body.issueDate || new Date().toISOString(),
                    CurrencyCode: body.currency || "TRY",
                    ExchangeRate: body.exchangeRate || 1
                },
                // CompanyInfo: Makbuzu Düzenleyen Firma (Bizim bilgilerimiz - normalde DB'den çekilir)
                CompanyInfo: {
                    TaxNumber: "1111111111", 
                    Name: "Örnek Tüccar A.Ş.",
                    TaxOffice: "Merkez",
                    Address: "Örnek Mah. Tüccar Sok.",
                    District: "Merkez",
                    City: "İstanbul",
                    Country: "Türkiye"
                },
                // CustomerInfo: Müstahsil (Çiftçi / Satıcı)
                CustomerInfo: {
                    TaxNumber: body.customer?.taxNumber || "11111111111",
                    Name: body.customer?.name || "Bilinmeyen Üretici",
                    TaxOffice: "Yok",
                    Address: body.customer?.address || "Kayıtlı Adres Yok",
                    District: body.customer?.district || "Bilinmiyor",
                    City: body.customer?.city || "Bilinmiyor",
                    Country: "Türkiye"
                },
                ProducerLines: body.lines?.map((line: any) => {
                    const rowGross = Number(line.qty) * Number(line.unitPrice);
                    const taxes = [];

                    // SGK Kesintisi (Örn TaxCode v.b.)
                    if (Number(line.sgkRate) > 0) {
                        taxes.push({
                            TaxCode: "4071", // SGK Prim Kesintisi standard kodu
                            Total: rowGross * (Number(line.sgkRate) / 100),
                            Percent: Number(line.sgkRate),
                            ReasonCode: "",
                            ReasonDesc: "SGK Kesintisi"
                        });
                    }

                    // Borsa Tescil (Rüsum)
                    if (Number(line.borsaRate) > 0) {
                        taxes.push({
                            TaxCode: "9041", // Borsa
                            Total: rowGross * (Number(line.borsaRate) / 100),
                            Percent: Number(line.borsaRate),
                            ReasonCode: "",
                            ReasonDesc: "Borsa Tescil Ücreti"
                        });
                    }

                    // Mera Fonu
                    if (Number(line.meraRate) > 0) {
                        taxes.push({
                            TaxCode: "9042", // Mera
                            Total: rowGross * (Number(line.meraRate) / 100),
                            Percent: Number(line.meraRate),
                            ReasonCode: "",
                            ReasonDesc: "Mera Fonu"
                        });
                    }

                    return {
                        Name: line.name,
                        Quantity: Number(line.qty),
                        UnitType: "C62", // Adet/Kg C62 / KGM standard UBL kodlari
                        Price: Number(line.unitPrice),
                        Taxes: taxes,
                        GVWithholdingPercent: Number(line.gvRate) || 0,
                        GVWithholdingAmount: rowGross * (Number(line.gvRate) / 100)
                    };
                }),
                Notes: [
                    body.notes || "E-Müstahsil Makbuzu Periodya Enterprise ERP Tarafından Düzenlenmiştir."
                ]
            }
        };

        // TODO: Gerçek entegrasyonda Nilvera URL'sine fetch atılacak
        // const response = await fetch("https://apitest.nilvera.com/eproducer/Draft/Create", {
        //     method: "POST",
        //     headers: { "Authorization": `Bearer ${process.env.NILVERA_API_KEY}`, "Content-Type": "application/json" },
        //     body: JSON.stringify(nilveraPayload)
        // })

        // Mock başarılı yanıt
        return NextResponse.json({
            success: true,
            message: "Taslak başarıyla oluşturuldu",
            data: {
                draftId: Math.random().toString(36).substring(7),
                payload: nilveraPayload // Debugging için payload'ı da dönüyoruz
            }
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
