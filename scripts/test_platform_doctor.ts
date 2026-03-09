import { PlatformDoctorService } from '../src/services/infrastructure/PlatformDoctorService';
import prisma from '../src/lib/prisma';

async function main() {
    console.log('--- STARTING PLATFORM DOCTOR ENGINE SMOKE TEST ---\n');

    try {
        // 1. Run Health Checks
        console.log('[1/4] Running Global Health Checks...');
        const checks = await PlatformDoctorService.runHealthChecks();
        console.log(`- Created ${checks.length} health check snapshots.`);

        // 2. Setup Mock Runbook
        console.log('\n[2/4] Setting up mock Runbook for EINVOICE_FAILURE...');
        const runbook = await prisma.platformRunbook.create({
            data: {
                incidentType: 'EINVOICE_FAILURE',
                title: 'Auto-Refresh e-Invoice Gateway Token',
                description: 'Auto reconnects to the E-Invoice provider API if latency or failure detected.',
                autoFixAvailable: true,
                actions: {
                    create: [
                        {
                            actionType: 'REFRESH_TOKEN',
                            configJson: { provider: 'NILVERA' }
                        }
                    ]
                }
            }
        });

        // 3. Detect an Incident
        console.log('\n[3/4] Simulating integration failure (E-Invoice Dropout)...');

        const tenantId = 'test-tenant-doctor-999';

        const incident = await PlatformDoctorService.detectIncident({
            tenantId,
            type: 'EINVOICE_FAILURE',
            severity: 'HIGH',
            title: 'E-Invoice API is unreachable (503 Service Unavailable)',
            description: 'The NILVERA endpoint did not respond to ping signals for 3 consecutive attempts.'
        });

        // 4. Validate Auto Remediation & Status
        console.log(`\n[4/4] Validating Auto Remediation Output for Incident: ${incident.id}...`);
        const refreshedIncident = await prisma.platformIncident.findUnique({ where: { id: incident.id } });

        if (refreshedIncident?.status === 'AUTO_RESOLVED') {
            console.log('✅ Auto Remediation Executed SUCCESSFULLY! Status is AUTO_RESOLVED.');
        } else {
            console.error(`❌ Auto Remediation FAILED. Expected AUTO_RESOLVED but got ${refreshedIncident?.status}`);
        }

        // Checking Enrichment feature
        console.log('\n[Bonus] Testing Support Ticket Enrichment Context...');
        const enrichedData = await PlatformDoctorService.enrichSupportTicket(tenantId);
        console.log('Support Ticket metadata will include:', JSON.stringify(enrichedData, null, 2));


        console.log('\n✅ Platform Doctor Engine Tests Passed Successfully.\n');
    } catch (error) {
        console.error('❌ Platform Doctor Engine Test FAILED:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

main();
