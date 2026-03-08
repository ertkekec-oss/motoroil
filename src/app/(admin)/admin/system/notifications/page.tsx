import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from 'next/link';

export default async function AdminSystemNotificationsPage() {
    const session = await getSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'PLATFORM_ADMIN')) {
        return notFound();
    }

    const tenantId = session.companyId || (session as any).tenantId;

    // Fetch the latest 50 app notifications scoped to tenant (including broadcast)
    const notifications = await prisma.appNotification.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 50,
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
                            Uygulama Olay Geçmişi (Event Bus)
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Sistem düzeyindeki kritik hatalar, OTP/Mail sorunları ve global bildirim okumaları.</p>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card, rgba(239,68,68,0.02))', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.2)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Event Tipi:</div>
                        <select style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px', fontSize: '12px' }}>
                            <option>Tüm Olaylar (All)</option>
                            <option>İletim Hataları (MAIL_FAILED)</option>
                            <option>OTP Hataları (OTP_FAILED)</option>
                            <option>Uyuşmazlıklar (DISPUTED)</option>
                        </select>
                        <button style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                            Süz (Filtrele)
                        </button>
                    </div>

                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) minmax(200px, 2.5fr) 150px 100px', gap: '16px', background: 'rgba(255,255,255,0.01)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                        <div>Zaman & Başlık</div>
                        <div>Olay Detayı / Mesaj</div>
                        <div>Hedef Kullanıcı</div>
                        <div style={{ textAlign: 'center' }}>Event Tipi</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                                Harika! Hiçbir kritik sistem olayı (Event) bulunamadı.
                            </div>
                        ) : (
                            notifications.map((n, i) => {
                                const isCriticalError = n.type === 'MAIL_FAILED' || n.type === 'OTP_FAILED';

                                return (
                                    <div key={n.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) minmax(200px, 2.5fr) 150px 100px', gap: '16px', padding: '16px 24px', borderBottom: i !== notifications.length - 1 ? '1px solid var(--border-color)' : 'none', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }} className="hover:bg-white/5 transition-colors">
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: '800', color: isCriticalError ? '#ef4444' : 'var(--text-main)', marginBottom: '4px' }}>
                                                {n.title}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                {new Date(n.createdAt).toLocaleString('tr-TR')}
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: '600' }}>
                                                {n.message}
                                            </div>
                                            {n.metaJson && Object.keys(n.metaJson as object).length > 0 && (
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '4px', fontStyle: 'italic' }}>
                                                    {JSON.stringify(n.metaJson).substring(0, 80)}...
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <div style={{ fontSize: '11px', fontWeight: '800', padding: '4px 8px', borderRadius: '6px', background: n.userId ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)', color: n.userId ? '#3b82f6' : 'var(--text-muted)', display: 'inline-block' }}>
                                                {n.userId ? `USER_${n.userId.substring(0, 6)}` : 'BROADCAST (System)'}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: isCriticalError ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', color: isCriticalError ? '#ef4444' : 'var(--text-muted)', width: '100%', wordBreak: 'break-all' }}>
                                                {n.type}
                                            </div>
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
