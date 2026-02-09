
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountForKasa, syncKasaBalancesToLedger } from '@/lib/accounting';
import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user;

    try {
        // SECURITY: Tenant Isolation
        const company = await prisma.company.findFirst({
            where: { tenantId: session.tenantId }
        });

        if (!company && session.tenantId !== 'PLATFORM_ADMIN') {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });
        }

        const kasalar = await prisma.kasa.findMany({
            where: {
                isActive: true,
                ...(company ? { companyId: company.id } : {}) // Skip filter for platform admin
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ success: true, kasalar }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Surrogate-Control': 'no-store'
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user;

    try {
        // SECURITY: Tenant Isolation
        const company = await prisma.company.findFirst({
            where: { tenantId: session.tenantId }
        });

        if (!company) {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });
        }

        const body = await request.json();
        const { name, type, balance, branch } = body;
        const branchName = branch || 'Merkez';

        console.log(`[KASA_POST] Adding kasa: ${name}, Type: ${type}, Branch: ${branchName}`);

        // 1. Check if an match (Name + Branch + Company) exists (case-insensitive)
        const existing = await prisma.kasa.findFirst({
            where: {
                companyId: company.id,
                name: { equals: name, mode: 'insensitive' },
                branch: { equals: branchName, mode: 'insensitive' }
            }
        });

        if (existing) {
            if (!existing.isActive) {
                console.log(`[KASA_POST] Reactivating inactive kasa: ${existing.id}`);
                const reactivated = await prisma.kasa.update({
                    where: { id: existing.id },
                    data: {
                        isActive: true,
                        type: type || existing.type,
                        branch: branchName // Ensure it takes the correct casing from request
                    }
                });

                // Sync with Accounting
                try {
                    await getAccountForKasa(reactivated.id, branchName);
                    // If balance > 0, we might need a sync but usually reactivation doesn't change balance
                } catch (e) { console.error('Accounting Sync Error:', e); }

                return NextResponse.json({ success: true, kasa: reactivated });
            } else {
                console.log(`[KASA_POST] Active duplicate found: ${existing.name} in branch ${existing.branch}`);
                return NextResponse.json({
                    success: false,
                    error: `BU ŞUBEDE ZATEN VAR: "${existing.name}" (Şube: ${existing.branch})`
                }, { status: 400 });
            }
        }

        const kasa = await prisma.kasa.create({
            data: {
                companyId: company.id, // Set Company ID
                name,
                type,
                balance: balance || 0,
                branch: branchName
            }
        });

        // Sync with Accounting immediately
        try {
            await getAccountForKasa(kasa.id, branchName);

            // If there's an opening balance, create opening slip
            if (Number(balance) !== 0) {
                // TODO: Verify if syncKasaBalancesToLedger respects company isolation
                await syncKasaBalancesToLedger(branchName, company.id);
            }
        } catch (e) {
            console.error('Accounting Sync Error (Create):', e);
        }

        console.log(`[KASA_POST] Created new kasa: ${kasa.id}`);
        return NextResponse.json({ success: true, kasa });
    } catch (error: any) {
        console.error('[KASA_POST] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
