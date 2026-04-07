import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function AdminSignaturesTemplatesPage() {
    const session = await getSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'PLATFORM_ADMIN')) {
        return notFound();
    }

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <Link href="/admin/signatures" style={{ color: '#888', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '12px' }} className="hover:text-blue-500">
                            <span style={{ fontSize: '16px' }}>←</span> İmza Yönetimine Dön
                        </Link>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            Belge Şablonları
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Ortak imza davetlerinde ve mutabakat akışlarında kullanılacak evrak şablonları.</p>
                    </div>
                    <div>
                        <button disabled style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'not-allowed', opacity: 0.5 }}>
                            + Yeni Şablon Aktar
                        </button>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) 1fr 1fr auto', gap: '16px', background: 'rgba(255,255,255,0.01)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                        <div>Şablon Adı</div>
                        <div>Tür</div>
                        <div>Son Güncelleme</div>
                        <div style={{ width: '80px', textAlign: 'center' }}>Durum</div>
                    </div>

                    {/* Empty State Mock */}
                    <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', opacity: 0.2, marginBottom: '24px' }}>📄</div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Henüz Şablon Eklenmemiş</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
                            Şablon sistemi aktif edildiğinde buraya PDF/Word belgeleri yükleyerek ve değişkenler ekleyerek (e.g., {"{{companyName}}"}) hazır imzalanabilir formlar oluşturabileceksiniz.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
