import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from 'next/link';

export default async function AdminReconciliationDashboardPage() {
    const session = await getSession();
    if (!session || (session.role !== 'SUPERADMIN' && session.role !== 'ADMIN')) {
        return notFound();
    }

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

    const pendingCount = (statusMap['SENT'] || 0) + (statusMap['VIEWED'] || 0) + (statusMap['SIGNING'] || 0);
    const approvedCount = statusMap['SIGNED'] || 0;
    const disputedCount = statusMap['DISPUTED'] || 0;
    const totalCount = stats.reduce((sum, curr) => sum + curr._count._all, 0);

    const recentAudits = await prisma.reconciliationAuditEvent.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { reconciliation: { select: { id: true } } }
    });

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <Link href="/admin" style={{ color: '#888', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '12px' }} className="hover:text-blue-500">
                            <span style={{ fontSize: '16px' }}>←</span> Yönetim Paneline Dön
                        </Link>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            Mutabakat Platform Yönetimi
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Sistem düzeyinde mutabakat motoru, operasyonları ve ağ politikaları.</p>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '24px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Ekosistem Hacmi</div>
                        <div style={{ fontSize: '32px', fontWeight: '900' }}>{totalCount}</div>
                    </div>
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '24px' }}>
                        <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Tamamlanan Zincir</div>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#10b981' }}>{approvedCount}</div>
                    </div>
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '24px' }}>
                        <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Askıda İşlem / Bekleyen</div>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#3b82f6' }}>{pendingCount}</div>
                    </div>
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '24px' }}>
                        <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Uyuşmazlıklar</div>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#ef4444' }}>{disputedCount}</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '32px' }}>
                    {/* Placeholder for System Jobs */}
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.5px' }}>Toplu Mutabakat İşleri (Jobs)</h2>
                            <span style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '6px', fontWeight: 'bold' }}>RUNNING</span>
                        </div>
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                            <div style={{ fontSize: '32px', opacity: 0.5, marginBottom: '16px' }}>⚙️</div>
                            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px' }}>Sistem Stabil</h3>
                            <p style={{ fontSize: '13px', margin: 0 }}>Arka planda e-posta veya SMS teslimatında bekleyen tıkanıklık (queue) gözükmüyor.</p>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.5px' }}>Global Ağ Denetimi</h2>
                            <Link href="/admin/reconciliation/audit" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }} className="hover:underline">
                                Tümü
                            </Link>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {recentAudits.length === 0 ? (
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>Sistemde henüz hareket yok.</div>
                            ) : (
                                recentAudits.map((audit) => (
                                    <div key={audit.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', marginTop: '6px' }}></div>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: '700' }}>{audit.action}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                {new Date(audit.createdAt).toLocaleString()} • {audit.actorType}
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
