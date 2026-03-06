import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from 'next/link';

export default async function AdminReconAuditPage() {
    const session = await getSession();
    if (!session || (session.role !== 'SUPERADMIN' && session.role !== 'ADMIN')) {
        return notFound();
    }

    const tenantId = session.companyId || (session as any).tenantId;

    // Fetch the latest 50 audit events for this tenant's reconciliation module
    const auditEvents = await prisma.reconciliationAuditEvent.findMany({
        where: { reconciliation: { tenantId } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
            reconciliation: {
                select: { id: true, account: { select: { name: true } } }
            }
        }
    });

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <Link href="/admin/reconciliation" style={{ color: '#888', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '12px' }} className="hover:text-blue-500">
                            <span style={{ fontSize: '16px' }}>←</span> Mutabakat Yönetimine Dön
                        </Link>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            Mutabakat Audit İzleri (Denetim)
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Global olarak atılan tüm davetler, redler, B2B logları. En yeni 50 kayıt.</p>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Denetim Kapsamı Ara:</div>
                        <input type="text" placeholder="IP, Aktör, Zarf ID veya Eylem..." style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '6px', fontSize: '12px', width: '300px' }} />
                        <button style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                            Süz (Filtrele)
                        </button>
                    </div>

                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) minmax(200px, 2fr) minmax(180px, 1.5fr) minmax(150px, 1.5fr)', gap: '16px', background: 'rgba(255,255,255,0.01)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                        <div>Zaman & Olay (Action)</div>
                        <div>Zarf (Recon ID) & Cari</div>
                        <div>Aktör (Kullanıcı / Sistem)</div>
                        <div style={{ textAlign: 'center' }}>Payload Detayı</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {auditEvents.length === 0 ? (
                            <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                                Henüz hiçbir audit kaydı bulunamadı.
                            </div>
                        ) : (
                            auditEvents.map((evt, i) => {
                                const isError = evt.action.includes('REJECTED') || evt.action.includes('DISPUTE');
                                const isSuccess = evt.action.includes('SIGNED') || evt.action.includes('RESOLVED');

                                return (
                                    <div key={evt.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) minmax(200px, 2fr) minmax(180px, 1.5fr) minmax(150px, 1.5fr)', gap: '16px', padding: '16px 24px', borderBottom: i !== auditEvents.length - 1 ? '1px solid var(--border-color)' : 'none', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }} className="hover:bg-white/5 transition-colors">
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: '800', color: isError ? '#ef4444' : isSuccess ? '#10b981' : '#3b82f6', marginBottom: '4px' }}>
                                                {evt.action}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                {new Date(evt.createdAt).toLocaleString()}
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                                {evt.reconciliation.account?.name || 'TANIMSIZCARI'}
                                            </div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
                                                R_ID: {evt.reconciliationId.substring(0, 8).toUpperCase()}
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {evt.actorType}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            {evt.payload && Object.keys(evt.payload as object).length > 0 ? (
                                                <button
                                                    title={JSON.stringify(evt.payload, null, 2)}
                                                    style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '11px', color: 'white', cursor: 'help' }}
                                                >
                                                    [Log Meta]
                                                </button>
                                            ) : (
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>-</div>
                                            )}
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
