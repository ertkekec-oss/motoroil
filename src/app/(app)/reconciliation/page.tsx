import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from 'next/link';

export default async function ReconciliationDashboardPage() {
    const session = await getSession();
    if (!session) return notFound();

    const tenantId = session.companyId || (session as any).tenantId;

    // Fetch aggregate statistics
    const stats = await prisma.reconciliation.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { _all: true }
    });

    const statusMap = stats.reduce((acc: any, curr) => {
        acc[curr.status] = curr._count._all;
        return acc;
    }, {});

    const totalCount = stats.reduce((sum, curr) => sum + curr._count._all, 0);
    const pendingCount = (statusMap['SENT'] || 0) + (statusMap['VIEWED'] || 0) + (statusMap['SIGNING'] || 0);
    const approvedCount = statusMap['SIGNED'] || 0;
    const disputedCount = statusMap['DISPUTED'] || 0;
    const draftCount = (statusMap['DRAFT'] || 0) + (statusMap['GENERATED'] || 0);

    // Fetch latest activities (Audit Events)
    const latestAudits = await prisma.reconciliationAuditEvent.findMany({
        where: { reconciliation: { tenantId } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { reconciliation: { select: { id: true, accountId: true } } }
    });

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            Mutabakat Panosu
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Cari mutabakatlarınızın güncel özet durumu.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Link href="/reconciliation/list" style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold', border: '1px solid var(--border-color)' }} className="hover:bg-white/10">
                            Tüm Listeyi Gör
                        </Link>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '24px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Toplam Mutabakat</div>
                        <div style={{ fontSize: '32px', fontWeight: '900' }}>{totalCount}</div>
                    </div>
                    <div style={{ background: 'rgba(59,130,246,0.05)', borderRadius: '20px', border: '1px solid rgba(59,130,246,0.2)', padding: '24px' }}>
                        <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Cevap Bekleyen</div>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#3b82f6' }}>{pendingCount}</div>
                    </div>
                    <div style={{ background: 'rgba(16,185,129,0.05)', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)', padding: '24px' }}>
                        <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Onaylanan</div>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#10b981' }}>{approvedCount}</div>
                    </div>
                    <div style={{ background: 'rgba(245,158,11,0.05)', borderRadius: '20px', border: '1px solid rgba(245,158,11,0.2)', padding: '24px' }}>
                        <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>İtirazlı (Disput)</div>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#f59e0b' }}>{disputedCount}</div>
                    </div>
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '24px', opacity: 0.7 }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Hazırlık / Taslak</div>
                        <div style={{ fontSize: '32px', fontWeight: '900' }}>{draftCount}</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '32px' }}>
                    {/* Placeholder for Quick Actions or Latest Pending */}
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '32px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', letterSpacing: '-0.5px' }}>Dikkat Bekleyenler</h2>
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                            <div style={{ fontSize: '32px', opacity: 0.5, marginBottom: '16px' }}>⚡</div>
                            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px' }}>Tümü Gözden Geçirildi</h3>
                            <p style={{ fontSize: '13px', margin: 0 }}>Şu an için itirazlı veya süresi dolmak üzere olan acil mutabakatınız bulunmuyor.</p>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '32px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', letterSpacing: '-0.5px' }}>Son Hareketler</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {latestAudits.length === 0 ? (
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>Sistemde henüz hareket yok.</div>
                            ) : (
                                latestAudits.map((audit) => (
                                    <div key={audit.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', marginTop: '6px' }}></div>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: '700' }}>{audit.action}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                {new Date(audit.createdAt).toLocaleString()} • Zarf: {audit.reconciliationId.substring(0, 8)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
