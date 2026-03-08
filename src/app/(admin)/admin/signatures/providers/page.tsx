import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminSignaturesProvidersPage() {
    const session = await getSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'PLATFORM_ADMIN')) {
        return notFound();
    }

    const tenantId = session.companyId || (session as any).tenantId;

    const netgsmConfig = await prisma.otpProviderConfig.findUnique({
        where: { tenantId_providerName: { tenantId, providerName: 'NETGSM' } }
    });

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <Link href="/admin/signatures" style={{ color: '#888', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '12px' }} className="hover:text-blue-500">
                            <span style={{ fontSize: '16px' }}>←</span> İmza Yönetimine Dön
                        </Link>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            Sağlayıcılar (Providers)
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>E-İmza, Zaman Damgası ve SMS/OTP servis sağlayıcı yapılandırmaları.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>

                    {/* SMS OTP Provider */}
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '24px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📱</div>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Netgsm</h3>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>SMS OTP Sağlayıcı</div>
                                </div>
                            </div>
                            <div style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: netgsmConfig?.isEnabled ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', color: netgsmConfig?.isEnabled ? '#10b981' : 'var(--text-muted)' }}>
                                {netgsmConfig?.isEnabled ? 'AKTİF' : 'PASİF'}
                            </div>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px', flex: 1 }}>
                            SMS tabanlı telefon doğrulama (2FA) servisi. İmza zarflarında "OTP Zorunlu" kuralı işletildiğinde tetiklenir.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {netgsmConfig?.isEnabled ? `Günlük Deneme Limit: ${netgsmConfig.maxDailyAttempts}` : 'Yapılandırılmadı'}
                            </div>
                            <Link href="/admin/signatures/providers/netgsm" style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold', border: '1px solid var(--border-color)' }} className="hover:bg-white/10">
                                Yönet
                            </Link>
                        </div>
                    </div>

                    {/* Periodya Basic Provider */}
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '24px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🖋️</div>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Periodya Internal E-Sign</h3>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Basit Elektronik İmza</div>
                                </div>
                            </div>
                            <div style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                                SİSTEM (AKTİF)
                            </div>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px', flex: 1 }}>
                            Sistem dahili imza loglaması ve hash mühürlemesi motoru. Zarf süreçlerinde default olarak çalışır.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                            <button disabled style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'bold', cursor: 'not-allowed' }}>
                                Sistem Bileşeni
                            </button>
                        </div>
                    </div>

                    {/* eSign / DocuSign Mock */}
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '24px', position: 'relative', display: 'flex', flexDirection: 'column', opacity: 0.6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', filter: 'grayscale(100%)' }}>🔵</div>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>DocuSign Yönlendirici</h3>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Gelişmiş Nitelikli İmza</div>
                                </div>
                            </div>
                            <div style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                YAKINDA
                            </div>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px', flex: 1 }}>
                            Global niteklikli ESIGN uyumu veya kurumsal 3. parti imzalayıcılara webhook fırlatan adaptör katmanı.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                            <button disabled style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'bold', border: '1px solid var(--border-color)', cursor: 'not-allowed' }}>
                                Kurulum (Yakında)
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
