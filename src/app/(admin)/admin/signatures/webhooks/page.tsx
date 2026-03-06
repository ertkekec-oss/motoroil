import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function AdminSignaturesPage() {
    const session = await getSession();
    if (!session || (session.role !== 'SUPERADMIN' && session.role !== 'ADMIN')) {
        return notFound();
    }

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <Link href="/admin/signatures" style={{ color: '#888', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '12px' }} className="hover:text-blue-500">
                            <span style={{ fontSize: '16px' }}>←</span> Ana Ayarlara Dön
                        </Link>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            Modül Ayarları
                        </h1>
                    </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '64px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', opacity: 0.5, marginBottom: '16px' }}>⚙️</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>İnşa Ediliyor</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Bu modülün yönetim ekranları bir sonraki fazda aktif edilecektir.</p>
                </div>
            </div>
        </div>
    );
}
