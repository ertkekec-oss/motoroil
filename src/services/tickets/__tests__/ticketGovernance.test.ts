import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { redactPII } from '../piiRedaction';
import { createTicket, addTicketMessage, changeTicketStatus, runTicketSlaMonitor, getTickets, getTicketDetails } from '../ticketService';
import { calculateSlaDueAt } from '../slaEngine';

const prisma = new PrismaClient();

describe('G1 - Ticket Governance & PII Redaction', () => {
    // Shared Tenant IDs
    const PLATFORM_ID = 'PLATFORM_TENANT_CONST';
    const BUYER_ID = 'TEST_BUYER_TICKET';
    const SELLER_ID = 'TEST_SELLER_TICKET';

    let orderId: string;
    let shipmentId: string;
    let lineId: string;
    let ticketId: string;

    beforeAll(async () => {
        // Setup base data
        const t1 = await prisma.tenant.create({ data: { name: 'Tenant B', ownerEmail: 'b@example.com' } });
        const t2 = await prisma.tenant.create({ data: { name: 'Tenant S', ownerEmail: 's@example.com' } });

        await prisma.company.createMany({
            data: [
                { id: BUYER_ID, name: 'T Buyer', vkn: 'buy1234567', taxNumber: 'taxB', tenantId: t1.id },
                { id: SELLER_ID, name: 'T Seller', vkn: 'sel1234567', taxNumber: 'taxS', tenantId: t2.id },
                { id: PLATFORM_ID, name: 'Platform Admin', vkn: 'admin000', taxNumber: 'taxA', tenantId: t1.id }
            ],
            skipDuplicates: true
        });

        const order = await prisma.networkOrder.create({
            data: {
                buyerCompanyId: BUYER_ID,
                sellerCompanyId: SELLER_ID,
                subtotalAmount: 100, totalAmount: 100, shippingAmount: 0, commissionAmount: 10,
                status: 'DELIVERED', itemsHash: 'x', currency: 'TRY'
            }
        });
        orderId = order.id;

        const shipment = await prisma.shipment.create({
            data: { networkOrderId: orderId, mode: 'MANUAL', carrierCode: 'TC', trackingNumber: 'T_TRACK' }
        });
        shipmentId = shipment.id;

        const inv = await prisma.shippingInvoice.create({
            data: { carrierId: 'TEST_CARRIER', invoiceNo: 'INV_T1', totalAmount: 10 }
        });

        const line = await prisma.shippingInvoiceLine.create({
            data: {
                shippingInvoiceId: inv.id,
                trackingNo: 'T_TRACK',
                chargeAmount: 10,
                matchStatus: 'DISPUTED',
                shipmentId: shipment.id
            }
        });
        lineId = line.id;
    });

    afterAll(async () => {
        // Cleanup all
        if (ticketId) {
            await prisma.ticketAuditLog.deleteMany({ where: { ticketId: ticketId } });
            await prisma.ticketMessage.deleteMany({ where: { ticketId: ticketId } });
            await prisma.ticket.delete({ where: { id: ticketId } });
        }

        await prisma.shippingInvoiceLine.deleteMany({ where: { trackingNo: 'T_TRACK' } });
        await prisma.shippingInvoice.deleteMany({ where: { invoiceNo: 'INV_T1' } });
        await prisma.shipment.deleteMany({ where: { id: shipmentId } });
        await prisma.networkOrder.deleteMany({ where: { id: orderId } });

        await prisma.idempotencyRecord.deleteMany({ where: { scope: 'TICKET_SYSTEM' } });
    });

    it('should redact exact PII formats', () => {
        const input = "Contact me at test@example.com or mobile +905551234567.";
        const redacted = redactPII(input);

        expect(redacted).not.toContain('test@example.com');
        expect(redacted).not.toContain('+905551234567');

        // Assert masks
        expect(redacted).toContain('[REDACTED_EMAIL]');
        expect(redacted).toContain('[REDACTED_PHONE]');
    });

    it('should create a ticket with idempotency and isolation', async () => {
        const rawMessage = "Hello, please refund me on +905554321098. URL: https://example.com";
        const res = await createTicket(
            SELLER_ID,
            PLATFORM_ID,
            'SHIPPING_DISPUTE',
            'SHIPPING_LINE',
            lineId,
            'HIGH',
            rawMessage,
            'user1'
        );
        ticketId = res.id;

        expect(res).toBeDefined();
        expect(res.status).toBe('OPEN');

        // Ensure PII was redacted on first message
        expect((res as any).messages[0].redactedMessage).toContain('[REDACTED_PHONE]');

        // Ensure audit log
        const logs = await prisma.ticketAuditLog.findMany({ where: { ticketId } });
        expect(logs.length).toBe(1);
        expect(logs[0].action).toBe('CREATED');

        // Test idempotency
        await expect(createTicket(
            SELLER_ID,
            PLATFORM_ID,
            'SHIPPING_DISPUTE',
            'SHIPPING_LINE',
            lineId,
            'HIGH',
            rawMessage,
            'user1'
        )).rejects.toThrow('ALREADY_SUCCEEDED');
    }, 15000);

    it('should block cross-tenant visibility', async () => {
        // Buyer should not see seller's ticket if not assigned
        const buyerView = await getTickets(BUYER_ID, false);
        expect(buyerView.find(t => t.id === ticketId)).toBeUndefined();

        // Seller should see it
        const sellerView = await getTickets(SELLER_ID, false);
        expect(sellerView.find(t => t.id === ticketId)).toBeDefined();

        // Trying to access specific ticket as buyer should throw
        if (ticketId) {
            await expect(getTicketDetails(ticketId, BUYER_ID, false))
                .rejects.toThrow('UNAUTHORIZED');
        }
    });

    it('should add message and change status back to IN_PROGRESS if RESOLVED originally, with audit', async () => {
        if (ticketId) {
            // Change to RESOLVED first
            await changeTicketStatus(ticketId, PLATFORM_ID, 'RESOLVED', true);
            const resolvedTic = await prisma.ticket.findUnique({ where: { id: ticketId } });
            expect(resolvedTic?.status).toBe('RESOLVED');

            // Seller replies 
            await addTicketMessage(ticketId, SELLER_ID, 'SELLER', 'Actually wait, still an issue', false);

            const activeTic = await prisma.ticket.findUnique({ where: { id: ticketId } });
            expect(activeTic?.status).toBe('IN_PROGRESS'); // Implicit re-open

            const logs = await prisma.ticketAuditLog.findMany({ where: { ticketId } });
            expect(logs.some((l: any) => l.action === 'STATUS_CHANGED' && (l.payloadJson as any).new === 'IN_PROGRESS')).toBe(true);
        }
    });

    it('should run background monitor and mark SLA breach if past due', async () => {
        if (ticketId) {
            // Force the ticket's SLA due to past
            await prisma.ticket.update({
                where: { id: ticketId },
                data: { slaDueAt: new Date(Date.now() - 10000) } // 10 seconds ago
            });

            await runTicketSlaMonitor();

            const breachCheck = await prisma.ticket.findUnique({ where: { id: ticketId } });
            expect(breachCheck?.status).toBe('SLA_BREACH');

            const logs = await prisma.ticketAuditLog.findMany({ where: { ticketId, action: 'SLA_UPDATED' } });
            expect(logs.length).toBe(1);
        }
    });
});
