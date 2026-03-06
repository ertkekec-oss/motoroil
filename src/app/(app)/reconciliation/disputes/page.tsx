import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from 'next/link';

export default async function ReconciliationDisputesPage() {
    const session = await getSession();
    if (!session) return notFound();

    const tenantId = session.companyId || (session as any).tenantId;

    // Fetch latest disputes
    const disputes = await prisma.reconciliationDispute.findMany({
        where: { reconciliation: { tenantId } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
            reconciliation: {
                include: { account: true }
            }
        }
    });

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            Uyuşmazlıklar (Disputes)
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Cari mutabakatlara firmalar tarafından yapılan itirazların merkezi.</p>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card, rgba(239,68,68,0.02))', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.2)', overflow: 'hidden' }}>
                    {/* Filters */}
                    <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Filtrele:</div>
                        <select style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '6px', fontSize: '12px' }}>
                            <option>Açık (İncelenecekler)</option>
                            <option>Çözülenler</option>
                            <option>Tümü</option>
                        </select>
                        <button style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                            Uygula
                        </button>
                    </div>

                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) 150px minmax(200px, 2fr) 100px 100px', gap: '16px', background: 'rgba(255,255,255,0.01)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                        <div>İlgili Firma & Mutabakat</div>
                        <div>Tarih</div>
                        <div>İtiraz Nedeni / Not</div>
                        <div>Durum</div>
                        <div style={{ textAlign: 'center' }}>İşlem</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {disputes.length === 0 ? (
                            <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                                Harika! Hiç mutabakat uyuşmazlığı bulunmuyor.
                            </div>
                        ) : (
                            disputes.map((d, i) => {
                                const isOpen = d.status === 'OPEN' || d.status === 'UNDER_REVIEW';

                                return (
                                    <div key={d.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) 150px minmax(200px, 2fr) 100px 100px', gap: '16px', padding: '16px 24px', borderBottom: i !== disputes.length - 1 ? '1px solid var(--border-color)' : 'none', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }} className="hover:bg-white/5 transition-colors">
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: '800', marginBottom: '4px' }}>
                                                {d.reconciliation.account?.name || 'Bilinmiyor'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                Zarf: {d.reconciliationId.substring(0, 8).toUpperCase()}
                                            </div>
                                        </div>

                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {new Date(d.createdAt).toLocaleDateString('tr-TR')}
                                        </div>

                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                                                {d.reason.replace(/_/g, ' ')}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                                                "{d.customerNote ? (d.customerNote.substring(0, 40) + '...') : '-'}"
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: isOpen ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: isOpen ? '#ef4444' : '#10b981' }}>
                                                {d.status}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'center' }}>
                                            <Link href={`/reconciliation/${d.reconciliationId}`} style={{ padding: '6px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', textDecoration: 'none', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: 'bold' }} className="hover:bg-white/10">
                                                İncele
                                            </Link>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
