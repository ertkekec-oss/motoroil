import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function AdminSignaturesWebhooksPage() {
    const session = await getSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'PLATFORM_ADMIN')) {
        return notFound();
    }

    // Mock Payload for Webhook Logs
    // In production, this would query a WebhookEvent tabme
    const mockLogs = [
        { id: 'wh_evt_0981bA', provider: 'DocuSign', eventType: 'envelope.completed', status: 'PROCESSED', createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), payloadSum: 'Envelope 9182C finalized' },
        { id: 'wh_evt_4419xC', provider: 'Netgsm', eventType: 'sms.delivered', status: 'IGNORED', createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), payloadSum: 'MsgId: 1982245' },
        { id: 'wh_evt_1155gT', provider: 'DocuSign', eventType: 'envelope.declined', status: 'FAILED', createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), payloadSum: 'User signature refused' },
        { id: 'wh_evt_9987kZ', provider: 'E-Guven', eventType: 'timestamp.issued', status: 'PROCESSED', createdAt: new Date(Date.now() - 1000 * 60 * 400).toISOString(), payloadSum: 'TSR generated for doc_91A' },
    ];

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <Link href="/admin/signatures" style={{ color: '#888', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '12px' }} className="hover:text-blue-500">
                            <span style={{ fontSize: '16px' }}>←</span> İmza Yönetimine Dön
                        </Link>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            Webhook & Callbacks (Ağ Dinleyicisi)
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Harici sağlayıcılardan (DocuSign, E-Güven vb.) gelen asenkron olaylar ve durum raporları.</p>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) minmax(180px, 1.5fr) minmax(200px, 2fr) 150px 100px', gap: '16px', background: 'rgba(255,255,255,0.01)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                        <div>Sağlayıcı</div>
                        <div>Olay (Event Type)</div>
                        <div>Payload Özeti</div>
                        <div>Zaman</div>
                        <div style={{ textAlign: 'center' }}>Durum</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {mockLogs.map((log, i) => (
                            <div key={log.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) minmax(180px, 1.5fr) minmax(200px, 2fr) 150px 100px', gap: '16px', padding: '16px 24px', borderBottom: i !== mockLogs.length - 1 ? '1px solid var(--border-color)' : 'none', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }} className="hover:bg-white/5 transition-colors">
                                <div style={{ fontWeight: '700', fontSize: '14px' }}>{log.provider}</div>
                                <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: log.status === 'FAILED' ? '#ef4444' : '#10b981' }}></span>
                                    {log.eventType}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {log.payloadSum}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {new Date(log.createdAt).toLocaleString()}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <div style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: log.status === 'PROCESSED' ? 'rgba(16,185,129,0.1)' : log.status === 'FAILED' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', color: log.status === 'PROCESSED' ? '#10b981' : log.status === 'FAILED' ? '#ef4444' : 'var(--text-muted)' }}>
                                        {log.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sayfa 1 / 1 (Sadece Son 50 Olay)</div>
                        <button disabled={true} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: 'bold' }}>
                            Failed Olayları Yeniden İşle (Retry)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
