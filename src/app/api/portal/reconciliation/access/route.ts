import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { applyPortalRateLimit, buildPortalAuditPayload } from "@/lib/portal-security";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token || typeof token !== 'string') {
            return NextResponse.json({ success: false, error: 'Token missing' }, { status: 400 });
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
                    include: {
                        company: { select: { name: true, vkn: true } },
                        account: { select: { name: true, taxNumber: true } }
                    }
                }
            }
        });

        if (!portalToken) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        if (portalToken.revokedAt) return NextResponse.json({ success: false, error: 'Token revoked' }, { status: 403 });
        if (portalToken.expiresAt < new Date()) return NextResponse.json({ success: false, error: 'Token expired' }, { status: 403 });

        const recon = portalToken.reconciliation;

        // Mark as used on first visit
        if (!portalToken.usedAt) {
            await prisma.$transaction([
                prisma.reconciliationPortalToken.update({
                    where: { id: portalToken.id },
                    data: { usedAt: new Date() }
                }),
                prisma.reconciliationAuditEvent.create({
                    data: {
                        tenantId: recon.tenantId,
                        reconciliationId: recon.id,
                        ...buildPortalAuditPayload('PORTAL_VIEWED', security, { token: tokenHash })
                    }
                })
            ]);
        } else {
            // Log subsequent views
            await prisma.reconciliationAuditEvent.create({
                data: {
                    tenantId: recon.tenantId,
                    reconciliationId: recon.id,
                    ...buildPortalAuditPayload('PORTAL_VIEWED', security, { note: "Subsequent view", token: tokenHash })
                }
            });
        }

        // Return exact minimum fields needed for the portal, excluding internal DB ids
        return NextResponse.json({
            success: true,
            data: {
                periodStart: recon.periodStart,
                periodEnd: recon.periodEnd,
                balance: recon.balance,
                status: recon.status, // We allow client to see if it's already finalized
                companyName: recon.company.name,
                customerName: recon.account.name
            }
        });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
