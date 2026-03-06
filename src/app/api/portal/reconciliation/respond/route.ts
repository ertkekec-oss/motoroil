import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { applyPortalRateLimit, buildPortalAuditPayload, triggerInternalNotification } from "@/lib/portal-security";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token, action, note, attachmentKey } = body;

        if (!token || typeof token !== "string" || !['ACCEPT', 'REJECT', 'DISPUTE'].includes(action)) {
            return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Apply Rate Limiting
        const security = await applyPortalRateLimit(req, tokenHash);
        if (!security.ok) {
            return NextResponse.json({ success: false, error: security.error }, { status: security.status });
        }

        const portalToken = await prisma.reconciliationPortalToken.findUnique({
            where: { tokenHash },
            include: {
                reconciliation: {
                    include: { account: true }
                }
            }
        });

        if (!portalToken) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        if (portalToken.revokedAt) return NextResponse.json({ success: false, error: 'Token revoked' }, { status: 403 });
        if (portalToken.expiresAt < new Date()) return NextResponse.json({ success: false, error: 'Token expired' }, { status: 403 });

        const recon = portalToken.reconciliation;

        // Replay/Race condition block: Must be idempotent. If already processed, exit gracefully.
        if (['SIGNED', 'REJECTED', 'DISPUTED', 'VOID'].includes(recon.status)) {
            return NextResponse.json({ success: false, error: `Already processed (${recon.status})` }, { status: 400 });
        }

        // Action logic inside transaction
        await prisma.$transaction(async (tx) => {
            let newStatus = recon.status;

            if (action === 'ACCEPT') {
                newStatus = 'SIGNED'; // Using SIGNED as CONFIRMED since enum exists
            } else if (action === 'REJECT') {
                newStatus = 'REJECTED';
            } else if (action === 'DISPUTE') {
                newStatus = 'DISPUTED';
                // Create secure dispute record
                await tx.reconciliationDispute.create({
                    data: {
                        tenantId: recon.tenantId,
                        companyId: recon.companyId,
                        reconciliationId: recon.id,
                        message: note || "Portal üzerinden itiraz edildi",
                        attachmentKey: attachmentKey || null,
                        status: 'OPEN' // Default state for new disputes
                    }
                });
            }

            // Lock record status effectively blocking subsequent requests
            await tx.reconciliation.update({
                where: { id: recon.id },
                data: { status: newStatus as any }
            });

            // Make sure usedAt is populated if it wasn't already 
            if (!portalToken.usedAt) {
                await tx.reconciliationPortalToken.update({
                    where: { id: portalToken.id },
                    data: { usedAt: new Date() }
                });
            }

            // Rich Audit log
            const auditAction = action === 'ACCEPT' ? 'RECON_ACCEPTED' : action === 'REJECT' ? 'RECON_REJECTED' : 'RECON_DISPUTE_CREATED';
            await tx.reconciliationAuditEvent.create({
                data: {
                    tenantId: recon.tenantId,
                    reconciliationId: recon.id,
                    ...buildPortalAuditPayload(auditAction, security, { token: tokenHash, note })
                }
            });
        });

        // Loop back internal notification
        const periodStr = `${recon.periodStart.toLocaleDateString()} - ${recon.periodEnd.toLocaleDateString()}`;
        await triggerInternalNotification({
            tenantId: recon.tenantId,
            companyId: recon.companyId,
            reconciliationId: recon.id,
            action: action === 'ACCEPT' ? 'ACCEPTED' : action === 'REJECT' ? 'REJECTED' : 'DISPUTED',
            note,
            customerName: recon.account.name,
            periodInfo: periodStr
        });

        // Minimized response
        return NextResponse.json({ success: true, message: `Completed action: ${action}` });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
