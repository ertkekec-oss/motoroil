import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from 'next/link';
import ReconciliationDetailClient from './ReconDetailClient';

export default async function ReconciliationDetailPage({ params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session) return notFound();

    const tenantId = session.companyId || (session as any).tenantId;
    const { id } = await params;

    const recon = await prisma.reconciliation.findUnique({
        where: { id },
        include: {
            customer: true,
            items: true,
            counterparties: true,
            disputes: {
                include: { items: true }
            },
            auditEvents: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!recon || recon.tenantId !== tenantId) {
        return notFound();
    }

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <ReconciliationDetailClient reconciliation={recon} />
            </div>
        </div>
    );
}
