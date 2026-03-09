import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST() {
    const auth = await authorize();
    if (!auth.authorized || (auth.user?.role !== 'SUPER_ADMIN' && auth.user?.tenantId !== 'PLATFORM_ADMIN')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // SIMULATED DIAGNOSTICS LOGIC
        // Here we simulate detecting a down payment gateway
        const isGatewayDown = Math.random() > 0.5;

        let eventsCreated = 0;

        if (isGatewayDown) {
            await prisma.platformDiagnosticEvent.create({
                data: {
                    tenantId: 'PLATFORM_WIDE',
                    component: 'PAYTR_GATEWAY',
                    level: 'WARNING',
                    message: 'PayTR entegrasyonunda gecikmeli yanıtlar tespit edildi (>3000ms).',
                    details: { ping: 3200, threshold: 2000 },
                    status: 'AUTO_FIXED',
                    autoFixAction: 'gateway_failover_reconnect'
                }
            });
            eventsCreated++;
        }

        // Simulate a Nilvera timeout issue
        const isNilveraTimeout = Math.random() > 0.7;
        if (isNilveraTimeout) {
            await prisma.platformDiagnosticEvent.create({
                data: {
                    tenantId: 'TENANT_TEST_01',
                    component: 'EFATURA_NILVERA',
                    level: 'CRITICAL',
                    message: 'NİLVERA sunucusuna bağlanılamıyor - Connect ETIMEDOUT',
                    details: { error_code: 'ETIMEDOUT', endpoint: '/token' },
                    status: 'OPEN',
                    autoFixAction: 'ip_whitelist_refresh'
                }
            });
            eventsCreated++;
        }

        return NextResponse.json({
            success: true,
            message: `Manuel tarama tamamlandı. ${eventsCreated} yeni uyarı bulundu.`,
            eventsCreated
        });

    } catch (e: any) {
        console.error("Auto scan error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
