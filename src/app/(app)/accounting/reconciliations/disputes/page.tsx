import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DisputesClient from "./DisputesClient";

export const dynamic = 'force-dynamic';

export default async function ReconciliationsDisputesPage() {
    const session = await getSession();
    if (!session) return notFound();

    const tenantId = session.companyId || session.tenantId;

    const disputes = await prisma.reconciliationDispute.findMany({
        where: { tenantId },
        include: {
            reconciliation: {
                include: {
                    customer: true
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 100 // Reasonable cap for UI
    });

    // Serialize dates
    const serializedDisputes = JSON.parse(JSON.stringify(disputes));

    return <DisputesClient disputes={serializedDisputes} />;
}
