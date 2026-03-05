import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getReconciliationStats, listReconciliations } from "@/services/finance/reconciliation/query";
import ReconciliationsClient from "./ReconciliationsClient";

export const dynamic = 'force-dynamic';

export default async function ReconciliationsPage({ searchParams }: { searchParams: Promise<any> }) {
    const session = await getSession();
    if (!session) return notFound();

    const params = await searchParams;
    const page = parseInt(params.page || '1');
    const tenantId = session.companyId || session.tenantId;

    const stats = await getReconciliationStats(tenantId);
    const { data, totalCount, totalPages, currentPage } = await listReconciliations(tenantId, page, 50);

    return (
        <ReconciliationsClient
            reconciliations={data}
            stats={stats}
            pagination={{ totalCount, totalPages, currentPage }}
        />
    );
}
