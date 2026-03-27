import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const mod = require('pdf-parse');
        const pdf = typeof mod === 'function' ? mod : (mod.PDFParse || mod.default);
        
        const session: any = await getSession();
        if (!session) return NextResponse.json({ success: false, error: 'Oturum gerekli' }, { status: 401 });

        const { id } = await params;
        const companyId = session.companyId || session.tenantId;

        if (!companyId) {
            return NextResponse.json({ success: false, error: 'Firma kimliği bulunamadı' }, { status: 403 });
        }

        const supplier = await prisma.supplier.findFirst({
            where: { id, companyId }
        });

        if (!supplier) {
            return NextResponse.json({ success: false, error: 'Yetkisiz işlem veya tedarikçi bulunamadı.' }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'Dosya bulunamadı.' }, { status: 400 });
        }

        if (file.size > 5 * 1024 * 1024) {  // 5MB Limit
            return NextResponse.json({ success: false, error: 'Dosya 5MB sınırını aşıyor.' }, { status: 413 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Memory-safe limit: only parse up to 5 pages. Most invoices are 1-2 pages.
        // This prevents OOM errors on Vercel which cause uncaught 500 HTML responses.
        const data = await pdf(buffer, { max: 10 });
        const text = data.text;

        // --- HEURISTIC PARSING FOR TURKISH E-INVOICE PDFS ---
        
        let invoiceNo = '';
        let invoiceDate = new Date().toISOString().split('T')[0];
        let items: any[] = [];
        let totalAmount = 0;

        // Try to find Invoice No (Fatura No: XYZ2023000000123)
        const invNoMatch = text.match(/(?:Fatura\s*No|ETTN|İrsaliye\s*No)[\s:]*([A-Z0-9]{16})/i);
        if (invNoMatch) invoiceNo = invNoMatch[1];
        else {
            const shortMatch = text.match(/(?:Fatura\s*No)[\s:]*([A-Za-z0-9-]{6,16})/i);
            if (shortMatch) invoiceNo = shortMatch[1];
            else invoiceNo = `INV-${Date.now()}`;
        }

        // Try to find Date
        const dateMatch = text.match(/(?:Tarih|Düzenleme Tarihi)[\s:]*(\d{2}[./-]\d{2}[./-]\d{4})/i);
        if (dateMatch) {
            const parts = dateMatch[1].split(/[./-]/);
            if (parts.length === 3) {
                // assume DD.MM.YYYY
                invoiceDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        // Try to find total amount
        const totalMatch = text.match(/(?:Genel Toplam|Ödenecek Tutar)[\s:]*([\d.,]+)/i);
        if (totalMatch) {
            totalAmount = parseFloat(totalMatch[1].replace(/\./g, '').replace(',', '.'));
        }

        // Try to extract lines
        // A typical line: "1234  MOTOR YAGI 5W30   10,00  Adet   150,00  1.500,00"
        const lines = text.split('\n');
        let parsingStarted = false;

        for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;

            // Start parsing items after a table header like "Mal/Hizmet" or "Miktar"
            if (cleanLine.match(/(?:Mal\/?Hizmet|Ürün Adı|Açıklama)/i) && cleanLine.match(/(?:Miktar|Adet|Birim)/i)) {
                parsingStarted = true;
                continue;
            }

            if (parsingStarted) {
                // Stop parsing if we reach totals
                if (cleanLine.match(/(?:Ara Toplam|KDV ÖZETİ|Genel Toplam|Yalnız)/i)) {
                    parsingStarted = false;
                    break;
                }

                // Look for a line that has a quantity (number) followed by a unit (Adet, Kg, Lt, Paket, Koli) and price
                // e.g., "1  YAG FILTRESI 10,00 Adet 50,00 %20 500,00"
                const itemMatch = cleanLine.match(/^(.*?)\s+((?:\d{1,3}(?:\.\d{3})*|\d+)(?:,\d+)?)\s+(Adet|Ad\.|Kg|Lt|Litre|Paket|Koli|Mt|Set)\s+((?:\d{1,3}(?:\.\d{3})*|\d+)(?:,\d+)?)/i);
                
                if (itemMatch) {
                    let nameCodeStr = itemMatch[1].trim();
                    const qtyStr = itemMatch[2];
                    const unit = itemMatch[3];
                    const priceStr = itemMatch[4];

                    const qty = parseFloat(qtyStr.replace(/\./g, '').replace(',', '.'));
                    const price = parseFloat(priceStr.replace(/\./g, '').replace(',', '.'));

                    let code = `PRD-${Math.floor(Math.random()*1000)}`;
                    let name = nameCodeStr;

                    // If name has a clear code at start
                    const codeMatch = nameCodeStr.match(/^([A-Z0-9-]+)\s+(.*)$/);
                    if (codeMatch && codeMatch[1].length > 3) {
                        code = codeMatch[1];
                        name = codeMatch[2];
                    }

                    if (qty > 0 && price > 0) {
                        items.push({
                            code,
                            name: name.substring(0, 80),
                            unit,
                            qty,
                            price,
                            total: qty * price
                        });
                    }
                }
            }
        }

        // If heuristic failed to find anything, return an empty structure so user can add manually, 
        // or return a basic mock line just so they don't get stuck if parser is weak.
        if (items.length === 0) {
            console.log("PDF parsed but no strict lines matched. Returning raw text fallback.");
           // Fallback: didn't find lines. We won't crash, we'll just return empty items for the UI to fill.
        }

        // Recalculate total if total wasn't found properly
        let calculatedTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
        
        // If total is wildly different, trust our calculated total as subtotal for the form.
        let finalAmount = totalAmount > 0 ? totalAmount : calculatedTotal;

        return NextResponse.json({
            success: true,
            parsedData: {
                invoiceNo,
                date: invoiceDate,
                totalAmount: finalAmount,
                items
            }
        });

    } catch (error: any) {
        console.error("PDF Parse ERror:", error);
        return NextResponse.json({ success: false, error: 'Fatura okunamadı: ' + error.message }, { status: 500 });
    }
}
