import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function isPlatformAdmin(session: any) {
    if (!session) return false;
    const role = session.role?.toUpperCase() || '';
    const tenantId = session.tenantId;
    return role === 'SUPER_ADMIN' || role === 'PLATFORM_FINANCE_ADMIN' || tenantId === 'PLATFORM_ADMIN';
}

export async function GET() {
    try {
        const session: any = await getSession();
        if (!isPlatformAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Rollout & Kill Switches
        const killSwitches = [
            'escrowPaused',
            'payoutPaused',
            'boostPaused'
        ];

        const settings = await prisma.appSettings.findMany({
            where: {
                companyId: 'PLATFORM_ADMIN',
                key: { in: [...killSwitches, 'globalEscrowDefaults', 'trustTierEffects'] }
            }
        });

        const configMap = settings.reduce((acc: any, s: any) => {
            acc[s.key] = s.value;
            return acc;
        }, {});

        const result = {
            escrowPaused: configMap.escrowPaused || false,
            payoutPaused: configMap.payoutPaused || false,
            boostPaused: configMap.boostPaused || false,
            globalEscrowDefaults: configMap.globalEscrowDefaults || {
                defaultHoldDays: 14,
                allowEarlyRelease: false,
                earlyReleaseFeeRate: 2.0,
                currency: 'TRY'
            },
            trustTierEffects: configMap.trustTierEffects || {
                A: { holdDaysDelta: -7 },
                B: { holdDaysDelta: -3 },
                C: { holdDaysDelta: 0 },
                D: { holdDaysDelta: 7 }
            }
        };

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Policies GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session: any = await getSession();
        if (!isPlatformAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { reason, ...updates } = body;

        if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
            return NextResponse.json({ error: 'A valid reason is required for governance changes' }, { status: 400 });
        }

        // Validate payload structure
        const validKeys = ['escrowPaused', 'payoutPaused', 'boostPaused', 'globalEscrowDefaults', 'trustTierEffects'];
        const keysToUpdate = Object.keys(updates).filter(k => validKeys.includes(k));

        if (keysToUpdate.length === 0) {
            return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            for (const key of keysToUpdate) {
                await tx.appSettings.upsert({
                    where: {
                        companyId_key: {
                            companyId: 'PLATFORM_ADMIN',
                            key: key
                        }
                    },
                    create: {
                        companyId: 'PLATFORM_ADMIN',
                        key: key,
                        value: updates[key]
                    },
                    update: {
                        value: updates[key]
                    }
                });
            }

            // Create Audit Log
            await tx.financeAuditLog.create({
                data: {
                    tenantId: 'PLATFORM_ADMIN',
                    action: 'ESCROW_POLICY_UPDATE',
                    actor: session.id || 'SYSTEM',
                    entityId: 'GLOBAL_CONFIG',
                    entityType: 'AppSettings',
                    payloadJson: { reason, updates }
                }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Policies POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
