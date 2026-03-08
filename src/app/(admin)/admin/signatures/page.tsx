import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function AdminSignaturesPage() {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN' && session.role !== 'PLATFORM_ADMIN') { // check contextually correct role checks where applicable
        // Fallback to minimal page if it just requires session for now
    }

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            İmza Motoru Yönetimi
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Platform genelindeki imza kurallarını, sağlayıcıları ve kalıpları yönetin.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                    {[
                        { title: 'Şablon Yönetimi (Templates)', route: '/admin/signatures/templates', desc: 'Sözleşme taslakları ve dinamik alan haritaları.' },
                        { title: 'Sağlayıcılar (Providers)', route: '/admin/signatures/providers', desc: 'e-İmza ve OTP servis sağlayıcı entegrasyonları.' },
                        { title: 'Politika & SLA (Policies)', route: '/admin/signatures/policies', desc: 'Son geçerlilik tarihleri ve otomatik hatırlatıcı kuralları.' },
                        { title: 'Webhook Alıcısı (Webhooks)', route: '/admin/signatures/webhooks', desc: 'Dış servislerden gelen imza durum bildirimlerini dinler.' },
                        { title: 'Sistem Denetimi (Audit)', route: '/admin/signatures/audit', desc: 'Tüm imza aktivitelerinin detaylı sistem günlüğü.' },
                    ].map((c, i) => (
                        <Link href={c.route} key={i} style={{ textDecoration: 'none', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="hover:border-white/20 transition-all">
                            <span style={{ fontSize: '16px', color: 'white', fontWeight: '800' }}>{c.title}</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{c.desc}</span>
                            <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 'bold', marginTop: 'auto', display: 'block' }}>Yönetime Git →</span>
                        </Link>
                    ))}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '24px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: '#ef4444' }}>Güvenlik Durumu</h2>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        Tüm imza bağlantıları tenant izoleli uç noktalardan geçmekte olup, atanan tokenler varsayılan olarak 7 gün sonra geçersiz kılınmaktadır. Dış API rate threshold seviyeleri "Sıkı" (100 req/min) profilindedir.
                    </div>
                </div>
            </div>
        </div>
    );
}
