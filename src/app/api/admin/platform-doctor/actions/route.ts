import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth';
import { PlatformDoctorService } from '@/services/infrastructure/PlatformDoctorService';

export async function POST(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = auth.user?.role;
    const isPlatformAdmin = auth.user?.tenantId === 'PLATFORM_ADMIN';

    if (!['SUPER_ADMIN'].includes(role || '') && !isPlatformAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { action, incidentId } = body;

        if (action === 'RESOLVE_INCIDENT') {
            await PlatformDoctorService.resolveIncident(incidentId);
            return NextResponse.json({ success: true, message: 'Incident marked as resolved.' });
        }

        if (action === 'RUN_HEALTH_CHECKS') {
            const checks = await PlatformDoctorService.runHealthChecks();
            return NextResponse.json({ success: true, checks });
        }

        if (action === 'TEST_AUTO_REMEDIATION') {
            await PlatformDoctorService.attemptAutoRemediation(incidentId);
            return NextResponse.json({ success: true, message: 'Auto-Remediation executed.' });
        }

        if (action === 'MOCK_DETECT_INCIDENT') {
            const incident = await PlatformDoctorService.detectIncident({
                tenantId: body.tenantId || null,
                type: body.type || 'API_ERROR',
                severity: body.severity || 'HIGH',
                title: body.title || 'Simulated E-Invoice API Timeout',
                description: body.description || 'API request timed out during automated checks.'
            });
            return NextResponse.json({ success: true, incident });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error: any) {
        console.error('Platform Doctor Admin Action Error:', error);
        return NextResponse.json({ error: 'Failed to process admin action.' }, { status: 500 });
    }
}
