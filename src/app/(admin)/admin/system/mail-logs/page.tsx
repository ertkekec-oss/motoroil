import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from 'next/link';

export default async function AdminMailLogsPage() {
    const session = await getSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'PLATFORM_ADMIN')) {
        return notFound();
    }

    const tenantId = session.companyId || (session as any).tenantId;

    // Fetch the latest 50 mail delivery logs
    const mailLogs = await prisma.mailDeliveryLog.findMany({
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
                            <span style={{ fontSize: '16px' }}>←</span> Sistem Ayarlarına Dön
                        </Link>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            Mail Gönderim Logları
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Tüm operasyonel e-posta metadataları ve iletim hataları (Son 50 kayıt).</p>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Filtrele:</div>
                        <select style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '6px', fontSize: '12px' }}>
                            <option>Tüm Durumlar</option>
                            <option>Hatalı İletimler (FAILED)</option>
                            <option>Başarılı Gönderimler (SENT)</option>
                            <option>Bekleyenler (PENDING)</option>
                        </select>
                        <select style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '6px', fontSize: '12px' }}>
                            <option>Tüm Kategoriler</option>
                            <option>Reconciliation Invitation</option>
                            <option>Signature Invitation</option>
                        </select>
                    </div>

                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '150px minmax(200px, 2fr) minmax(200px, 2fr) 120px 100px', gap: '16px', background: 'rgba(255,255,255,0.01)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                        <div>Tarih</div>
                        <div>Alıcı (To) & Konu</div>
                        <div>Kategori / Kaynak</div>
                        <div>Sağlayıcı</div>
                        <div style={{ textAlign: 'center' }}>Durum</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {mailLogs.length === 0 ? (
                            <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                                Henüz e-posta gönderim kaydı yok.
                            </div>
                        ) : (
                            mailLogs.map((log, i) => {
                                const isError = log.status === 'FAILED';
                                const isSuccess = log.status === 'SENT';

                                return (
                                    <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '150px minmax(200px, 2fr) minmax(200px, 2fr) 120px 100px', gap: '16px', padding: '16px 24px', borderBottom: i !== mailLogs.length - 1 ? '1px solid var(--border-color)' : 'none', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }} className="hover:bg-white/5 transition-colors">
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>
                                                {new Date(log.createdAt).toLocaleDateString('tr-TR')}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                {new Date(log.createdAt).toLocaleTimeString('tr-TR')}
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                                                {log.to}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {log.subject}
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>
                                                {log.category}
                                            </div>
                                            {log.relatedEntityType && (
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '4px' }}>
                                                    {log.relatedEntityType}: {log.relatedEntityId?.substring(0, 8)}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                                            {log.provider}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {isError && (
                                                    <button title={log.errorMessage || 'Unknown Error'} style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', cursor: 'help', border: 'none' }}>!</button>
                                                )}
                                                <div style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: isError ? 'rgba(239,68,68,0.1)' : isSuccess ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: isError ? '#ef4444' : isSuccess ? '#10b981' : '#f59e0b' }}>
                                                    {log.status}
                                                </div>
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
