import prisma from '@/lib/prisma';
import {
    PlatformIncidentType,
    PlatformIncidentSeverity,
    PlatformIncidentStatus,
    PlatformHealthStatus,
    RunbookActionType
} from '@prisma/client';

export class PlatformDoctorService {
    /**
     * 1. Run Health Checks across the platform
     * Mocks integration checks and updates the Health Dashboard.
     */
    static async runHealthChecks() {
        console.log('[Platform Doctor] Running health checks...');

        // Mock Checks
        const checks = [
            { service: 'E-Invoice API', status: 'OK' as PlatformHealthStatus, message: 'Connected' },
            { service: 'SMS Gateway', status: 'OK' as PlatformHealthStatus, message: 'Latency 45ms' },
            { service: 'Payment Gateway', status: 'WARNING' as PlatformHealthStatus, message: 'High latency detected' },
            { service: 'Webhook Listener', status: 'OK' as PlatformHealthStatus, message: 'Processing normally' }
        ];

        for (const check of checks) {
            await prisma.platformHealthCheck.create({
                data: {
                    service: check.service,
                    status: check.status,
                    message: check.message,
                    metadataJson: { timestamp: new Date().toISOString() }
                }
            });
        }

        return checks;
    }

    /**
     * 2. Detect Incidents (e.g. from Background Jobs or API Error Middleware)
     */
    static async detectIncident(params: {
        tenantId?: string | null;
        type: PlatformIncidentType;
        severity: PlatformIncidentSeverity;
        title: string;
        description: string;
    }) {
        console.log(`[Platform Doctor] Incident Detected: ${params.title}`);

        const incident = await prisma.platformIncident.create({
            data: {
                tenantId: params.tenantId || null,
                type: params.type,
                severity: params.severity,
                title: params.title,
                description: params.description,
                status: 'OPEN'
            }
        });

        // Automatically check for available runbook and attempt Auto-Remediation
        await this.attemptAutoRemediation(incident.id);

        return incident;
    }

    /**
     * 3. Attempt Auto Remediation via Runbooks
     */
    static async attemptAutoRemediation(incidentId: string) {
        const incident = await prisma.platformIncident.findUnique({ where: { id: incidentId } });
        if (!incident) return;

        // Transition to INVESTIGATING
        await prisma.platformIncident.update({
            where: { id: incidentId },
            data: { status: 'INVESTIGATING' }
        });

        const runbook = await prisma.platformRunbook.findFirst({
            where: {
                incidentType: incident.type,
                autoFixAvailable: true
            },
            include: { actions: true }
        });

        if (!runbook || runbook.actions.length === 0) {
            // Keep investigating / open for manual review
            return;
        }

        console.log(`[Platform Doctor] Found Runbook: ${runbook.title}. Executing auto-remediation...`);

        // Execute Actions (Mocked Execution)
        let success = true;
        for (const action of runbook.actions) {
            const actionResult = await this.executeRunbookAction(action.actionType, action.configJson);
            if (!actionResult) {
                success = false;
                break;
            }
        }

        if (success) {
            console.log(`[Platform Doctor] Auto-remediation successful for incident ${incidentId}.`);
            await prisma.platformIncident.update({
                where: { id: incidentId },
                data: {
                    status: 'AUTO_RESOLVED',
                    resolvedAt: new Date()
                }
            });
        } else {
            console.log(`[Platform Doctor] Auto-remediation failed for incident ${incidentId}. Flagging for manual review.`);
            await prisma.platformIncident.update({
                where: { id: incidentId },
                data: { status: 'OPEN' }
            });
        }
    }

    /**
     * 4. Execute a specific Runbook Action
     */
    static async executeRunbookAction(actionType: RunbookActionType, configJson: any): Promise<boolean> {
        console.log(`[Platform Doctor] Executing action: ${actionType}`);
        // Mock logic: Always succeeds for MVP purposes
        return true;
    }

    /**
     * 5. Get Platform Status for Admin Dashboard
     */
    static async getPlatformStatus(tenantId?: string | null) {
        const activeIncidents = await prisma.platformIncident.findMany({
            where: {
                status: { in: ['OPEN', 'INVESTIGATING'] },
                ...(tenantId ? { tenantId } : {})
            },
            orderBy: { createdAt: 'desc' }
        });

        const recentHealthChecks = await prisma.platformHealthCheck.findMany({
            take: 10,
            orderBy: { checkedAt: 'desc' }
        });

        return {
            status: activeIncidents.length > 0 ? 'WARNING' : 'HEALTHY',
            activeIncidents,
            recentHealthChecks
        };
    }

    /**
     * 6. Manually Resolve Incident
     */
    static async resolveIncident(incidentId: string) {
        return prisma.platformIncident.update({
            where: { id: incidentId },
            data: {
                status: 'RESOLVED',
                resolvedAt: new Date()
            }
        });
    }

    /**
     * 7. Ticket Enrichment (Connects to Support Ticket Engine)
     * Fetch context to append to a newly created ticket.
     */
    static async enrichSupportTicket(tenantId: string) {
        const activeIncidents = await prisma.platformIncident.findMany({
            where: {
                tenantId,
                status: { in: ['OPEN', 'INVESTIGATING'] }
            }
        });

        return {
            activeIncidents: activeIncidents.map(i => i.title),
            platformHealthStatus: activeIncidents.length > 0 ? 'DEGRADED' : 'OPTIMAL',
            doctorNotes: activeIncidents.length > 0 ? 'Sistemde potansiyel bağlantı problemleri tespit edildi.' : 'Sistem stabil çalışıyor.'
        };
    }
}
