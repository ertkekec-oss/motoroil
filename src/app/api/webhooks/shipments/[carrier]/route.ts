import { NextRequest, NextResponse } from 'next/server';
import { processShipmentEvent } from '@/services/shipment/processEvent';
import { ShipmentStatus } from '@prisma/client';
import crypto from 'crypto';

export async function POST(req: NextRequest, { params }: { params: { carrier: string } }) {
    try {
        const carrierCode = params.carrier.toUpperCase();

        const bodyText = await req.text();

        // 1. Signature Check placeholder
        if (!req.headers.has(`x-${params.carrier}-signature`)) {
            /* In real life, verify crypto hash against webhook secrets per carrier. */
            return NextResponse.json({ ok: false, message: 'Invalid signature' }, { status: 401 });
        }

        let body: any = {};
        try {
            body = JSON.parse(bodyText);
        } catch {
            // Invalid json fallback handling
            body = null;
        }

        if (!body) {
            return NextResponse.json({ ok: true, warn: 'Invalid payload parsed.' }); // Return 200 to prevent retries
        }

        // Mock Payload Structure - Assume carrier sends { tracking, status: "DELIVERED", description: "...", eventId: "..." }
        // Each carrier adapter (MNG, Yurtiçi, ODEL, etc) has vastly varying schemas. Let's generic map for this scenario.

        let statusParsed: ShipmentStatus = 'IN_TRANSIT';
        if (body.status === 'DELIVERED') statusParsed = 'DELIVERED';
        if (body.status === 'COMPLETED') statusParsed = 'COMPLETED';
        if (body.status === 'EXCEPTION') statusParsed = 'EXCEPTION';
        if (body.status === 'CANCELLED') statusParsed = 'CANCELLED';

        const rawEventId = body.eventId || `mock_${Date.now()}_${crypto.randomUUID()}`;

        await processShipmentEvent({
            carrierCode: carrierCode,
            carrierEventId: rawEventId,
            trackingNumber: body.tracking || body.trackingNumber,
            status: statusParsed,
            description: body.description || 'System generated tracking status',
            rawPayload: body
        });

        // Inbox event will return boolean and safely process it. Next handles http termination with 200 standardizing integration.
        return NextResponse.json({ ok: true });

    } catch (e: any) {
        // Return 200 so the carrier stops sending broken structures triggering unhandled server exceptions repeatedly.
        return NextResponse.json({ ok: true, warn: e.message });
    }
}
