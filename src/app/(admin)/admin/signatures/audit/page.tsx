import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminSignaturesAuditPage() {
    const session = await getSession();
    if (!session || (session.role !== 'SUPERADMIN' && session.role !== 'ADMIN')) {
        return notFound();
    }

    const tenantId = session.companyId || (session as any).tenantId;

    // Fetch the latest 50 audit events for this tenant's signature module
    const auditEvents = await prisma.signatureAuditEvent.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
            envelope: {
                select: { id: true, title: true }
            }
        }
    });

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <Link href="/admin/signatures" style={{ color: '#888', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '12px' }} className="hover:text-blue-500">
                            <span style={{ fontSize: '16px' }}>←</span> İmza Yönetimine Dön
                        </Link>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            İmza Audit Kayıtları (Loglar)
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Tüm zarf ve imza eylemlerinin merkezi iz düşümü. En yeni 50 kayıt görüntülenir.</p>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    {/* Filter Area Placeholder */}
                    <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Filtrele:</div>
                        <select style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '6px', fontSize: '12px' }}>
                            <option>Tüm Eylemler</option>
                            <option>Sadece İmzalananlar</option>
                            <option>Reddedilenler</option>
                            <option>OTP Hataları</option>
                        </select>
                        <input type="text" placeholder="Zarf ID veya İmzacı Ara..." style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '6px', fontSize: '12px', width: '250px' }} />
                        <button style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                            Uygula
                        </button>
                    </div>

                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) minmax(200px, 2fr) minmax(180px, 2fr) minmax(150px, 1.5fr)', gap: '16px', background: 'rgba(255,255,255,0.01)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                        <div>Zaman & Olay (Action)</div>
                        <div>Zarf (Envelope)</div>
                        <div>Aktör / Cihaz Özeti</div>
                        <div style={{ textAlign: 'right' }}>Meta Detay</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {auditEvents.length === 0 ? (
                            <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                                Henüz hiçbir audit kaydı bulunamadı.
                            </div>
                        ) : (
                            auditEvents.map((evt, i) => {
                                const isError = evt.action.includes('REJECTED') || evt.action.includes('FAILED');
                                const isSuccess = evt.action.includes('SIGNED') || evt.action.includes('COMPLETED') || evt.action.includes('VERIFIED');

                                return (
                                    <div key={evt.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) minmax(200px, 2fr) minmax(180px, 2fr) minmax(150px, 1.5fr)', gap: '16px', padding: '16px 24px', borderBottom: i !== auditEvents.length - 1 ? '1px solid var(--border-color)' : 'none', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }} className="hover:bg-white/5 transition-colors">
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
                                                {evt.envelope.title}
                                            </div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
                                                ENVELOPE: {evt.envelope.id.substring(evt.envelope.id.length - 8).toUpperCase()}
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {evt.actorId ? `Actor: ${evt.actorId.substring(0, 8)}...` : 'System Event'}
                                            </div>
                                            {evt.ip && (
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '4px' }}>
                                                    {evt.ip}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            {evt.metaJson && Object.keys(evt.metaJson as object).length > 0 ? (
                                                <button
                                                    title={JSON.stringify(evt.metaJson, null, 2)}
                                                    style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '11px', color: 'white', cursor: 'help' }}
                                                >
                                                    [JSON Data]
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
                {auditEvents.length > 0 && (
                    <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        Tam audit ve yasal dışa aktarım seçenekleri gelişmiş raporlar modülünde mevcuttur.
                    </div>
                )}
            </div>
        </div>
    );
}
