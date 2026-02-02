import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAccountingSlip, ACCOUNTS, getAccountForKasa } from '@/lib/accounting';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { status, kasaId } = body; // status: 'Tahsil Edildi', 'Ödendi', 'Karşılıksız', 'Ciro Edildi'

        const check = await prisma.check.findUnique({ where: { id } });
        if (!check) return NextResponse.json({ success: false, error: 'Çek bulunamadı' }, { status: 404 });

        if (check.status === status) return NextResponse.json({ success: true, check });

        // Logic based on types
        if (check.type === 'In') {
            // ALINAN ÇEKLER
            if (status === 'Tahsil Edildi') {
                if (!kasaId) return NextResponse.json({ success: false, error: 'Tahsilat için kasa/banka seçilmelidir' }, { status: 400 });

                const branch = check.branch || 'Merkez';
                let bankAcc;
                try {
                    bankAcc = await getAccountForKasa(kasaId, branch);
                } catch (e: any) {
                    console.error('getAccountForKasa Failed:', e);
                    return NextResponse.json({ success: false, error: 'Hesap planı hatası: ' + e.message }, { status: 500 });
                }

                // 1. Add money to Kasa (Handled via Transaction POST usually, but here we do it via DB update or Transaction API)
                // Let's create a Transaction with isAccountTransaction: true
                // But wait, status route should call the transaction API or replicate logic.
                // Better: Update Kasa Balance here and create Journal.

                await prisma.kasa.update({
                    where: { id: kasaId },
                    data: { balance: { increment: check.amount } }
                });

                await prisma.transaction.create({
                    data: {
                        type: 'Collection',
                        amount: check.amount,
                        description: `Çek Tahsilatı (${check.number}) - ${check.bank}`,
                        kasaId,
                        customerId: check.customerId || undefined, // Link to customer if valid
                        branch,
                        date: new Date()
                    }
                });

                // 2. Create Journal Entry (102 Banka Borç / 101 Alınan Çek Alacak)
                try {
                    await createAccountingSlip({
                        description: `Çek Tahsilatı: ${check.number} - ${check.bank}`,
                        date: new Date(),
                        sourceType: 'CheckTransition',
                        sourceId: check.id,
                        branch,
                        items: [
                            { accountCode: bankAcc.code, accountName: bankAcc.name, type: 'Borç', amount: Number(check.amount), documentType: 'BANKA_ISLEM' },
                            { accountCode: ACCOUNTS.ALINAN_CEKLER + '.01', accountName: 'ALINAN ÇEKLER PORTFÖYÜ', type: 'Alacak', amount: Number(check.amount), documentType: 'ÇEK' }
                        ]
                    });
                } catch (e: any) {
                    console.error('Accounting Slip Creation Failed:', e);
                    return NextResponse.json({ success: false, error: 'Yevmiye fişi oluşturulamadı: ' + e.message }, { status: 500 });
                }
            }
            else if (status === 'Karşılıksız') {
                const branch = check.branch || 'Merkez';
                // Reverse Customer Balance (Debt comes back)
                if (check.customerId) {
                    await prisma.customer.update({
                        where: { id: check.customerId },
                        data: { balance: { increment: check.amount } }
                    });
                }
                // 120 (Borç) / 101 (Alacak)
                try {
                    await createAccountingSlip({
                        description: `ÇEK KARŞILIKSIZ: ${check.number}`,
                        date: new Date(),
                        sourceType: 'CheckTransition',
                        sourceId: check.id,
                        branch,
                        items: [
                            { accountCode: ACCOUNTS.ALICILAR + '.01', accountName: 'ALICILAR', type: 'Borç', amount: Number(check.amount), documentType: 'ÇEK' },
                            { accountCode: ACCOUNTS.ALINAN_CEKLER + '.01', accountName: 'ALINAN ÇEKLER PORTFÖYÜ', type: 'Alacak', amount: Number(check.amount), documentType: 'ÇEK' }
                        ]
                    });
                } catch (e: any) {
                    return NextResponse.json({ success: false, error: 'Yevmiye fişi hatası: ' + e.message }, { status: 500 });
                }
            }
        }
        else if (check.type === 'Out') {
            // VERİLEN ÇEKLER
            if (status === 'Ödendi') {
                if (!kasaId) return NextResponse.json({ success: false, error: 'Ödeme için banka hesabı seçilmelidir' }, { status: 400 });

                const branch = check.branch || 'Merkez';
                let bankAcc;
                try {
                    bankAcc = await getAccountForKasa(kasaId, branch);
                } catch (e: any) {
                    return NextResponse.json({ success: false, error: 'Hesap planı hatası: ' + e.message }, { status: 500 });
                }

                await prisma.kasa.update({
                    where: { id: kasaId },
                    data: { balance: { decrement: check.amount } }
                });

                await prisma.transaction.create({
                    data: {
                        type: 'Payment',
                        amount: check.amount,
                        description: `Çek Ödemesi (${check.number}) - ${check.bank}`,
                        kasaId,
                        supplierId: check.supplierId || undefined, // Link to supplier if valid
                        branch,
                        date: new Date()
                    }
                });

                // 2. Journal: 103 (Borç) / 102 (Alacak)
                try {
                    await createAccountingSlip({
                        description: `Çek Ödemesi: ${check.number} - ${check.bank}`,
                        date: new Date(),
                        sourceType: 'CheckTransition',
                        sourceId: check.id,
                        branch,
                        items: [
                            { accountCode: ACCOUNTS.VERILEN_CEKLER + '.01', accountName: 'VERİLEN ÇEKLER', type: 'Borç', amount: Number(check.amount), documentType: 'BANKA_ISLEM' },
                            { accountCode: bankAcc.code, accountName: bankAcc.name, type: 'Alacak', amount: Number(check.amount), documentType: 'BANKA_ISLEM' }
                        ]
                    });
                } catch (e: any) {
                    return NextResponse.json({ success: false, error: 'Yevmiye fişi hatası: ' + e.message }, { status: 500 });
                }
            }
        }

        // Update Check Status
        const updatedCheck = await prisma.check.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json({ success: true, check: updatedCheck });

    } catch (error: any) {
        console.error('Check Status PATCH error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
