import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from 'next/link';

export default async function AppNotificationsPage() {
    const session = await getSession();
    if (!session || !session.userId) {
        return notFound();
    }

    const tenantId = session.companyId || (session as any).tenantId;

    // Fetch user or tenant notifications
    const notifications = await prisma.appNotification.findMany({
        where: {
            tenantId,
            OR: [
                { userId: session.userId },
                { userId: null } // broadcast to tenant level
            ]
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            Bildirim Merkezi
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Sistem olayları ve operasyonel geri bildirimler (Son 50).</p>
                    </div>
                    <div>
                        <button disabled style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: 'bold', cursor: 'not-allowed', opacity: 0.5 }}>
                            Tümünü Okundu İşaretle
                        </button>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) minmax(300px, 3fr) 120px', gap: '16px', background: 'rgba(255,255,255,0.01)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                        <div>Tarih & Tip</div>
                        <div>Mesaj İçeriği</div>
                        <div style={{ textAlign: 'center' }}>İşlem</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                                Gösterilecek hiçbir yeni bildirim yok.
                            </div>
                        ) : (
                            notifications.map((n, i) => {
                                const isUnread = !n.isRead;
                                const isCritical = n.type.includes('ERROR') || n.type.includes('FAILED') || n.type.includes('REJECTED') || n.type.includes('DISPUTE');

                                return (
                                    <div key={n.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) minmax(300px, 3fr) 120px', gap: '16px', padding: '20px 24px', borderBottom: i !== notifications.length - 1 ? '1px solid var(--border-color)' : 'none', alignItems: 'center', background: isUnread ? 'rgba(59,130,246,0.02)' : 'transparent', borderLeft: isUnread ? '3px solid #3b82f6' : '3px solid transparent' }} className="hover:bg-white/5 transition-colors">
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: '800', color: isCritical ? '#ef4444' : 'var(--text-main)', marginBottom: '4px' }}>
                                                {n.title}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                {new Date(n.createdAt).toLocaleString('tr-TR')}
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ fontSize: '13px', color: isUnread ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: isUnread ? '600' : '400' }}>
                                                {n.message}
                                            </div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '6px' }}>
                                                EVT: {n.type} {n.relatedEntityId ? `| REF: ${n.relatedEntityId.substring(0, 8)}` : ''}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            {n.relatedEntityType === 'Reconciliation' && (
                                                <Link href={`/reconciliation/${n.relatedEntityId}`} style={{ padding: '6px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', textDecoration: 'none', border: '1px solid var(--border-color)', fontSize: '11px', fontWeight: 'bold' }} className="hover:bg-white/10">
                                                    İncele
                                                </Link>
                                            )}
                                            {n.relatedEntityType === 'SignatureEnvelope' && (
                                                <Link href={`/signatures/envelopes/${n.relatedEntityId}`} style={{ padding: '6px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', textDecoration: 'none', border: '1px solid var(--border-color)', fontSize: '11px', fontWeight: 'bold' }} className="hover:bg-white/10">
                                                    Zarfa Git
                                                </Link>
                                            )}
                                            {/* generic fallback */}
                                            {!n.relatedEntityType && (
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
