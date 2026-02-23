
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, createSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;

        if (!session || !session.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { company, branch, finance, integrations } = data;

        const tenantId = session.tenantId;

        // 1. Get the company for this tenant
        let companyRecord = await prisma.company.findFirst({
            where: { tenantId: tenantId }
        });

        if (!companyRecord) {
            companyRecord = await prisma.company.create({
                data: {
                    tenantId: tenantId,
                    name: company.name || 'Şirketim',
                    vkn: company.vkn || '',
                    taxOffice: company.taxOffice || '',
                    address: company.address || '',
                    city: company.city || '',
                    district: company.district || '',
                }
            });
        } else {
            // Update existing company with onboarding data
            companyRecord = await prisma.company.update({
                where: { id: companyRecord.id },
                data: {
                    name: company.name || companyRecord.name,
                    vkn: company.vkn || companyRecord.vkn,
                    taxOffice: company.taxOffice || companyRecord.taxOffice,
                    address: company.address || companyRecord.address,
                    city: company.city || companyRecord.city,
                    district: company.district || companyRecord.district,
                }
            });
        }

        const results = await prisma.$transaction(async (tx) => {
            const createdItems: any = {};

            // 2. Create the Main Branch
            const mainBranch = await tx.branch.create({
                data: {
                    name: branch.branchName || 'Merkez Şube',
                    type: 'Şube',
                    city: company.city || '',
                    district: company.district || '',
                    address: company.address || '',
                    status: 'Active',
                    companyId: companyRecord!.id
                }
            });
            createdItems.branch = mainBranch;

            // 3. Create the Warehouse (as a branch with type 'Depo')
            const warehouse = await tx.branch.create({
                data: {
                    name: branch.warehouseName || 'Ana Depo',
                    type: 'Depo',
                    city: company.city || '',
                    district: company.district || '',
                    address: company.address || '',
                    status: 'Active',
                    companyId: companyRecord!.id
                }
            });
            createdItems.warehouse = warehouse;

            // 4. Create Default Kasa
            if (finance.createDefaultKasa) {
                const kasa = await tx.kasa.create({
                    data: {
                        name: finance.kasaName || 'Merkez TL Kasası',
                        type: 'Nakit',
                        currency: 'TRY',
                        balance: 0,
                        branch: mainBranch.name,
                        companyId: companyRecord!.id
                    }
                });
                createdItems.kasa = kasa;

                // Initialize Cash Payment Method in settings
                const currentSettings = await tx.appSettings.findUnique({
                    where: {
                        companyId_key: {
                            companyId: companyRecord!.id,
                            key: 'paymentMethods'
                        }
                    }
                });
                let pMethods = Array.isArray(currentSettings?.value) ? currentSettings.value : [
                    { id: 'cash', label: 'Nakit', type: 'cash', icon: '💵' },
                    { id: 'card', label: 'Kredi Kartı', type: 'card', icon: '💳' },
                    { id: 'transfer', label: 'Havale/EFT', type: 'transfer', icon: '🏦' }
                ];
                pMethods = pMethods.map((pm: any) => pm.type === 'cash' ? { ...pm, linkedKasaId: kasa.id } : pm);

                await tx.appSettings.upsert({
                    where: {
                        companyId_key: {
                            companyId: companyRecord!.id,
                            key: 'paymentMethods'
                        }
                    },
                    update: { value: pMethods },
                    create: {
                        companyId: companyRecord!.id,
                        key: 'paymentMethods',
                        value: pMethods
                    }
                });
            }

            // 5. Create Default Bank (as a Kasa of type Banka)
            if (finance.createDefaultBank) {
                const bank = await tx.kasa.create({
                    data: {
                        name: finance.bankName || 'Ana Banka Hesabı (TL)',
                        type: 'Banka',
                        currency: 'TRY',
                        balance: 0,
                        branch: mainBranch.name,
                        companyId: companyRecord!.id
                    }
                });
                createdItems.bank = bank;

                // Update transfer method to link to this bank
                const currentSettings = await tx.appSettings.findUnique({
                    where: {
                        companyId_key: {
                            companyId: companyRecord!.id,
                            key: 'paymentMethods'
                        }
                    }
                });
                let pMethods = Array.isArray(currentSettings?.value) ? currentSettings.value : [];
                if (pMethods.length > 0) {
                    pMethods = pMethods.map((pm: any) => pm.type === 'transfer' ? { ...pm, linkedKasaId: bank.id } : pm);
                    await tx.appSettings.update({
                        where: {
                            companyId_key: {
                                companyId: companyRecord!.id,
                                key: 'paymentMethods'
                            }
                        },
                        data: { value: pMethods }
                    });
                }
            }

            // 6. Save Integration Flags to AppSettings for later setup
            await tx.appSettings.upsert({
                where: {
                    companyId_key: {
                        companyId: companyRecord!.id,
                        key: 'onboarding_integrations'
                    }
                },
                update: { value: integrations },
                create: {
                    companyId: companyRecord!.id,
                    key: 'onboarding_integrations',
                    value: integrations
                }
            });

            // 7. Update Tenant Setup State
            await tx.tenant.update({
                where: { id: tenantId },
                data: { setupState: 'COMPLETED' }
            });

            // 8. Update User's company access if missing
            await tx.userCompanyAccess.upsert({
                where: {
                    userId_companyId: {
                        userId: session.id,
                        companyId: companyRecord!.id
                    }
                },
                create: {
                    userId: session.id,
                    companyId: companyRecord!.id,
                    role: 'ADMIN'
                },
                update: {}
            });

            // 9. Re-create session with updated setupState
            await createSession({
                ...session,
                setupState: 'COMPLETED'
            });

            return createdItems;
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Onboarding Init Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
