import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';
import { BankSyncEngine, RawBankTransaction } from '@/services/banking/bank-sync-engine';

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user;

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const iban = formData.get('iban') as string;

        if (!file || !iban) {
            return NextResponse.json({ success: false, error: 'Dosya ve IBAN gereklidir.' }, { status: 400 });
        }

        const xmlContent = await file.text();
        const parser = new XMLParser({ ignoreAttributes: false });
        const jsonObj = parser.parse(xmlContent);

        // Map BizimHesap / Generic Turkish Bank XML to RawBankTransaction
        // Note: Structure varies by bank, but BizimHesap often uses <Row>, <Transaction>, etc.
        let rawList: any[] = [];
        const root = jsonObj.AccountTransactions || jsonObj.root || jsonObj;
        const items = root.Transaction || root.Row || root.items || [];

        rawList = Array.isArray(items) ? items : [items];

        const company = await prisma.company.findFirst({ where: { tenantId: session.tenantId } });
        if (!company) throw new Error('Company not found');

        // Find or Create an XML Import Connection for this IBAN
        let connection = await (prisma as any).bankConnection.findFirst({
            where: { companyId: company.id, iban: iban }
        });

        if (!connection) {
            connection = await (prisma as any).bankConnection.create({
                data: {
                    companyId: company.id,
                    bankName: 'XML İthalat (BizimHesap)',
                    iban: iban,
                    connectionType: 'XML_IMPORT',
                    status: 'ACTIVE'
                }
            });
        }

        const normalizedTransactions: RawBankTransaction[] = rawList.map((item: any, idx: number) => {
            // Mapping logic (Flexible for common formats)
            const dateStr = item.Date || item.Tarih || item.date || new Date().toISOString();
            const amount = Number((item.Amount || item.Tutar || item.amount || "0").toString().replace(',', '.'));
            const description = item.Description || item.Aciklama || item.description || 'XML Kaydı';
            const refNum = item.RefNum || item.Referans || item.id || `XML_${Date.now()}_${idx}`;

            return {
                id: refNum,
                amount: amount,
                currency: item.Currency || item.Doviz || 'TRY',
                description: description,
                date: dateStr
            };
        });

        // Use the same SSOT engine as Open Banking
        const importedCount = await (BankSyncEngine as any).processTransactions(connection, normalizedTransactions);

        return NextResponse.json({
            success: true,
            imported: importedCount,
            totalFound: normalizedTransactions.length
        });

    } catch (error: any) {
        console.error('Bank XML Import Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
