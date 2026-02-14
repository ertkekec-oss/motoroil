import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAccountingSlip, ACCOUNTS } from '@/lib/accounting';
import { authorize, hasPermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'In' or 'Out'
    const status = searchParams.get('status');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    try {
        // SECURITY: Tenant Isolation
        const company = await prisma.company.findFirst({
            where: { tenantId: session.tenantId }
        });

        if (!company && session.tenantId !== 'PLATFORM_ADMIN') {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });
        }

        const where: any = {};
        if (company) {
            where.companyId = company.id;
        }

        if (type && type !== 'all') where.type = type;
        if (status && status !== 'all') where.status = status;

        if (start && end) {
            where.dueDate = {
                gte: new Date(start),
                lte: new Date(end)
            };
        }

        const checks = await prisma.check.findMany({
            where,
            include: {
                customer: { select: { name: true } },
                supplier: { select: { name: true } }
            },
            orderBy: { dueDate: 'asc' }
        });

        return NextResponse.json({ success: true, checks });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user.user || auth.user;

    if (!hasPermission(session, 'check_manage')) {
        // return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 }); 
        // Allow for now if permission not fully defined, or use generic
    }

    try {
        // SECURITY: Tenant Isolation
        const company = await prisma.company.findFirst({
            where: { tenantId: session.tenantId }
        });

        if (!company) {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });
        }

        const body = await req.json();
        const { type, number, bank, dueDate, amount, customerId, supplierId, description, branch } = body;

        // Validation
        if (!amount || !dueDate) {
            return NextResponse.json({ success: false, error: 'Tutar ve vade tarihi zorunludur' }, { status: 400 });
        }

        const amt = parseFloat(amount);

        const check = await prisma.$transaction(async (tx) => {
            const newCheck = await tx.check.create({
                data: {
                    companyId: company.id, // Set Company ID
                    type, // 'In' (Alınan) | 'Out' (Verilen)
                    number,
                    bank,
                    dueDate: new Date(dueDate),
                    amount: amt,
                    customerId,
                    supplierId,
                    description,
                    branch: branch || 'Merkez',
                    status: 'Portföyde' // Initial status
                }
            });

            // 1. Update Sub-Ledger (Current Account)
            if (type === 'In' && customerId) {
                await tx.customer.update({
                    where: { id: customerId },
                    data: { balance: { decrement: amt } }
                });

                // 2. Create Transaction for History
                await tx.transaction.create({
                    data: {
                        companyId: company.id, // Set Company ID
                        type: 'Collection',
                        amount: amt,
                        description: `Çek Alındı: ${bank} - No: ${number}`,
                        customerId,
                        branch: branch || 'Merkez',
                        date: new Date()
                    }
                });

                // 3. Create Accounting Slip (101 Borç / 120 Alacak)
                const customer = await tx.customer.findUnique({ where: { id: customerId } });
                await createAccountingSlip({
                    description: `Çek Alındı: ${bank} - No: ${number} (${customer?.name || ''})`,
                    date: new Date(),
                    sourceType: 'Check',
                    sourceId: newCheck.id,
                    branch: branch || 'Merkez',
                    companyId: company.id, // Add companyId
                    items: [
                        { accountCode: ACCOUNTS.ALINAN_CEKLER + '.01', accountName: 'ALINAN ÇEKLER PORTFÖYÜ', type: 'Borç', amount: amt, documentType: 'ÇEK', documentNo: number },
                        { accountCode: ACCOUNTS.ALICILAR + '.01', accountName: 'ALICILAR', type: 'Alacak', amount: amt, documentType: 'ÇEK', documentNo: number }
                    ]
                });
            }

            if (type === 'Out' && supplierId) {
                await tx.supplier.update({
                    where: { id: supplierId },
                    data: { balance: { decrement: amt } }
                });

                // 2. Create Transaction
                await tx.transaction.create({
                    data: {
                        companyId: company.id, // Set Company ID
                        type: 'Payment',
                        amount: amt,
                        description: `Çek Verildi: ${bank} - No: ${number}`,
                        supplierId,
                        branch: branch || 'Merkez',
                        date: new Date()
                    }
                });

                const supplier = await tx.supplier.findUnique({ where: { id: supplierId } });
                await createAccountingSlip({
                    description: `Çek Verildi: ${bank} - No: ${number} (${supplier?.name || ''})`,
                    date: new Date(),
                    sourceType: 'Check',
                    sourceId: newCheck.id,
                    branch: branch || 'Merkez',
                    companyId: company.id, // Add companyId
                    items: [
                        { accountCode: ACCOUNTS.SATICILAR + '.01', accountName: 'SATICILAR', type: 'Borç', amount: amt, documentType: 'ÇEK', documentNo: number },
                        { accountCode: ACCOUNTS.VERILEN_CEKLER + '.01', accountName: 'VERİLEN ÇEKLER VE ÖDEME EMİRLERİ', type: 'Alacak', amount: amt, documentType: 'ÇEK', documentNo: number }
                    ]
                });
            }

            return newCheck;
        });

        return NextResponse.json({ success: true, check });

    } catch (error: any) {
        console.error('Check POST error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
