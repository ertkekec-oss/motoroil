import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from 'next/link';

export default async function AdminReconTemplatesPage() {
    const session = await getSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'PLATFORM_ADMIN')) {
        return notFound();
    }

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <Link href="/admin/reconciliation" style={{ color: '#888', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '12px' }} className="hover:text-blue-500">
                            <span style={{ fontSize: '16px' }}>←</span> Mutabakat Yönetimine Dön
                        </Link>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            Beyan / Belge Şablonları (Templates)
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Cari Bakiye ve BA/BS formları için gönderilecek mutabakat form formatları.</p>
                    </div>
                    <div>
                        <button disabled style={{ padding: '10px 16px', borderRadius: '8px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'not-allowed', opacity: 0.5 }}>
                            + Yeni Şablon Oluştur
                        </button>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '32px' }}>
                    <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '48px', opacity: 0.2, marginBottom: '24px' }}>🖼️</div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Global Dinamik Şablonlar (Mock)</h3>
                        <p style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
                            PDF Generatörleri şu aşamada standart (Sistem Varsayılanı) tasarım ile çalışmaktadır. Dinamik sürükle-bırak editörü eklendiğinde bu alandan yönetilebilir olacak.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
