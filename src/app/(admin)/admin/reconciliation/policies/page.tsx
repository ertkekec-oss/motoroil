import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from 'next/link';

export default async function AdminReconPoliciesPage() {
    const session = await getSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'PLATFORM_ADMIN')) {
        return notFound();
    }

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <Link href="/admin/reconciliation" style={{ color: '#888', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '12px' }} className="hover:text-blue-500">
                            <span style={{ fontSize: '16px' }}>←</span> Mutabakat Yönetimine Dön
                        </Link>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            Platform Politikaları & Kurallar (Policies)
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Zamanlanmış, toplu mutabakat işleri ve Dispute SLA kuralları.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '32px' }}>
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', padding: '32px', border: '1px solid var(--border-color)' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>Sistem Varsayılan Kuralları (Mock)</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>Ön Tanımlı İtiraz (Dispute) Süresi</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Müşterinin gönderilen mutabakata cevap verme ve itiraz etme hakkının geçersiz olacağı iş günü süresi.</div>
                                </div>
                                <select
                                    defaultValue={"7"}
                                    style={{ padding: '8px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
                                >
                                    <option value="3" style={{ background: '#1a1a1a' }}>3 İş Günü</option>
                                    <option value="7" style={{ background: '#1a1a1a' }}>7 İş Günü (Varsayılan)</option>
                                    <option value="15" style={{ background: '#1a1a1a' }}>15 İş Günü</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>Aylık Mutabakat Zamanlaması (Auto-Cron)</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Her ayın bitiminde kapanış bilançoları için otomize edilmiş e-posta dağıtım kuralı.</div>
                                </div>
                                <select
                                    defaultValue={"disabled"}
                                    style={{ padding: '8px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
                                >
                                    <option value="disabled" style={{ background: '#1a1a1a' }}>Devre Dışı</option>
                                    <option value="last_day" style={{ background: '#1a1a1a' }}>Ayın Son Günü</option>
                                    <option value="5th_day" style={{ background: '#1a1a1a' }}>Sonraki Ayın 5. Günü</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                disabled
                                style={{ padding: '12px 24px', background: 'white', color: 'black', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'not-allowed', opacity: 0.5 }}
                            >
                                Geçici Olarak Kilitli
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
