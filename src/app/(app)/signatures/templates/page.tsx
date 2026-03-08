import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from 'next/link';

export default async function SignatureTemplatesPage() {
    const session = await getSession();
    if (!session) return notFound();

    // Mock templates
    const templates = [
        { id: 1, name: "B2B Tedarik Çerçeve Sözleşmesi", category: "CONTRACT", updated: "2 Gün Önce" },
        { id: 2, name: "Personel Gizlilik Anlaşması (NDA)", category: "AGREEMENT", updated: "1 Hafta Önce" },
        { id: 3, name: "KVKK Aydınlatma Metni", category: "FORM", updated: "1 Ay Önce" },
    ];

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <Link href="/signatures" style={{ color: '#888', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '12px' }} className="hover:text-blue-500">
                            <span style={{ fontSize: '16px' }}>←</span> Panoya Dön
                        </Link>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            Belge Şablonları
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Sık kullandığınız belge şablonlarını yönetin (Enterprise V2).</p>
                    </div>
                    <div>
                        <button style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold', border: '1px solid var(--border-color)', opacity: 0.5, cursor: 'not-allowed' }}>
                            + Yeni Şablon Yükle (Admin)
                        </button>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '100px minmax(200px, 2fr) 150px 150px', gap: '16px', background: 'rgba(255,255,255,0.01)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                        <div>Önizleme</div>
                        <div>Şablon Adı</div>
                        <div>Kategori</div>
                        <div>Son Güncelleme</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {templates.map((t, i) => (
                            <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '100px minmax(200px, 2fr) 150px 150px', gap: '16px', padding: '16px 24px', borderBottom: i !== templates.length - 1 ? '1px solid var(--border-color)' : 'none', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }} className="hover:bg-white/5 transition-colors">
                                <div style={{ fontSize: '24px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    📄
                                </div>

                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '4px' }}>
                                        {t.name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 'bold', display: 'inline-block', padding: '2px 6px', background: 'rgba(59,130,246,0.1)', borderRadius: '4px' }}>
                                        Kullanıma Hazır
                                    </div>
                                </div>

                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {t.category}
                                </div>

                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {t.updated}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
}
