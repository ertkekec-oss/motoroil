import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReconDetailClient from "./ReconDetailClient";

export const dynamic = 'force-dynamic';

export default async function ReconDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session) return notFound();

    const { id } = await params;
    const tenantId = session.companyId || session.tenantId;

    const recon = await prisma.reconciliation.findUnique({
        where: { id },
        include: {
            customer: true,
            snapshot: true,
            items: { orderBy: { date: 'asc' } },
            auditEvents: { orderBy: { createdAt: 'desc' } },
            disputes: {
                include: { items: true },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!recon || recon.tenantId !== tenantId) {
        return notFound();
    }

    // Process dates to ISO strings for client component safely
    const sRecon = JSON.parse(JSON.stringify(recon));

    return <ReconDetailClient reconciliation={sRecon} />;
}
