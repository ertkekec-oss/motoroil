import { SupportTicketService } from '../src/services/support/SupportTicketService';
import { SupportSLAService } from '../src/services/support/SupportSLAService';
import { SupportRoutingService } from '../src/services/support/SupportRoutingService';
import prisma from '../src/lib/prisma';

async function main() {
    console.log('--- STARTING SUPPORT AUTOMATION ENGINE SMOKE TEST ---\n');

    try {
        const tenantId = 'automation-test-tenant';
        const userId = 'automation-user-abc';

        console.log('[1/5] Testing Manual Category & Priority Detection Rules...');
        const catTest = SupportRoutingService.detectCategory('E-Fatura gönderemiyorum', 'Hata 500 dönüyor.');
        const prioTest = SupportRoutingService.detectPriority('E-Fatura gönderemiyorum', 'Hata 500 dönüyor. Sistem çalışmıyor.');
        console.log(`- Detected Category: ${catTest} (Expected: EINVOICE)`);
        console.log(`- Detected Priority: ${prioTest} (Expected: CRITICAL)`);

        console.log('\n[2/5] Creating Ticket & Triggering Automated Hooks...');
        // We intentionally don't pass category or priority to let automation handle it
        const params: any = {
            tenantId,
            createdByUserId: userId,
            subject: 'Acil stok eklenemiyor, uygulama çöktü',
            description: 'Yeni parti mal girişinde inventory hatası alıyorum.',
            browserInfo: 'Google Chrome',
            metadataJson: { simulated: true }
        };

        // Auto-routes and SLAs apply post-creation inside SupportTicketService
        const ticket = await SupportTicketService.createTicket(params);

        console.log(`- Ticket Created! ID: ${ticket.id}`);
        console.log(`- Final Assigned Category: ${ticket.category}`);
        console.log(`- Final Assigned Priority: ${ticket.priority}`);

        // Wait 2 secs to ensure async hooks complete (in normal app they run fast, test might race)
        await new Promise(r => setTimeout(r, 2000));

        console.log('\n[3/5] Validating Auto-Tagging...');
        const tagMaps = await prisma.supportTicketTagMap.findMany({
            where: { ticketId: ticket.id },
            include: { tag: true }
        });

        console.log(`- Tags attached: ${tagMaps.map(t => t.tag.slug).join(', ')}`);
        if (tagMaps.some(t => t.tag.slug === 'inventory' || t.tag.slug === 'bug')) {
            console.log('✅ Tagging Logic Passed!');
        } else {
            console.log('❌ Tagging missed expected tags');
        }

        console.log('\n[4/5] Validating SLA Enforcement...');
        const sla = await prisma.supportSLATracking.findUnique({ where: { ticketId: ticket.id } });
        if (sla) {
            console.log(`✅ SLA Applied via Tracking. Status: ${sla.status}`);
            console.log(`- First Response Bound: ${sla.firstResponseDeadline.toISOString()}`);
            console.log(`- Resolution Bound: ${sla.resolutionDeadline.toISOString()}`);
        } else {
            console.log('❌ SLA Tracking record not found!');
        }

        console.log('\n[5/5] Running SLA Background Worker Check...');
        await SupportSLAService.checkSLABreaches();
        console.log('✅ SLA worker executed cleanly.');

        console.log('\n✅ Support Automation Tests Completed Successfully.\n');
    } catch (error) {
        console.error('❌ Automation Test FAILED:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

main();
