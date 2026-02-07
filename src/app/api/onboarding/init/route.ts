
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, createSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const session: any = await getSession();
        if (!session || !session.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { branchName, city, district, address, createDefaultKasa, createDefaultBank } = data;

        const tenantId = session.tenantId;

        // 1. Get the default company for this tenant
        const company = await prisma.company.findFirst({
            where: { tenantId: tenantId }
        });

        if (!company) {
            return NextResponse.json({ error: 'Firma kaydı bulunamadı. Lütfen destekle iletişime geçin.' }, { status: 404 });
        }

        const results = await prisma.$transaction(async (tx) => {
            // 2. Create the Branch
            const branch = await tx.branch.create({
                data: {
                    name: branchName || 'Merkez Şube',
                    city: city || '',
                    district: district || '',
                    address: address || '',
                    status: 'Active',
                    companyId: company.id
                }
            });

            const createdItems: any = { branch };

            // 3. Create Default Kasa
            if (createDefaultKasa) {
                const kasa = await tx.kasa.create({
                    data: {
                        name: 'Merkez TL Kasası',
                        type: 'Nakit',
                        currency: 'TRY',
                        balance: 0,
                        branch: branch.name,
                        companyId: company.id
                    }
                });
                createdItems.kasa = kasa;

                // Initialize Cash Payment Method in settings
                const currentSettings = await tx.appSettings.findUnique({ where: { key: 'paymentMethods' } });
                let pMethods = Array.isArray(currentSettings?.value) ? currentSettings.value : [
                    { id: 'cash', label: 'Nakit', type: 'cash', icon: '💵' },
                    { id: 'card', label: 'Kredi Kartı', type: 'card', icon: '💳' },
                    { id: 'transfer', label: 'Havale/EFT', type: 'transfer', icon: '🏦' }
                ];

                // Update cash method to link to this kasa
                pMethods = pMethods.map((pm: any) => pm.type === 'cash' ? { ...pm, linkedKasaId: kasa.id } : pm);

                await tx.appSettings.upsert({
                    where: { key: 'paymentMethods' },
                    update: { value: pMethods },
                    create: { key: 'paymentMethods', value: pMethods }
                });
            }

            // 5. Create Default Bank
            if (createDefaultBank) {
                const bank = await tx.kasa.create({
                    data: {
                        name: 'Ana Banka Hesabı (TL)',
                        type: 'Banka',
                        currency: 'TRY',
                        balance: 0,
                        branch: branch.name,
                        companyId: company.id
                    }
                });
                createdItems.bank = bank;

                // Update transfer method to link to this bank
                const currentSettings = await tx.appSettings.findUnique({ where: { key: 'paymentMethods' } });
                let pMethods = Array.isArray(currentSettings?.value) ? currentSettings.value : [];
                if (pMethods.length > 0) {
                    pMethods = pMethods.map((pm: any) => pm.type === 'transfer' ? { ...pm, linkedKasaId: bank.id } : pm);
                    await tx.appSettings.update({
                        where: { key: 'paymentMethods' },
                        data: { value: pMethods }
                    });
                }
            }

            // 6. Update Tenant Setup State
            await tx.tenant.update({
                where: { id: tenantId },
                data: { setupState: 'COMPLETED' }
            });

            // 7. Re-create session with updated setupState to update the cookie
            await createSession({
                ...session,
                setupState: 'COMPLETED'
            });

            return createdItems;
        });

        return NextResponse.json({ success: true, data: results });

    } catch (error: any) {
        console.error('Onboarding Init Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
