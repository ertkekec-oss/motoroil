"use client";

export default function IntegrationsContent() {
    return (
        <div>
            <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Entegrasyonlar</h2>
            <p style={{ marginBottom: '30px', opacity: 0.7 }}>
                E-ticaret, muhasebe ve diğer sistem entegrasyonları için{' '}
                <a href="/integrations" target="_blank" style={{ color: 'var(--primary)', fontWeight: '700' }}>
                    Entegrasyonlar sayfasını ziyaret edin →
                </a>
            </p>

            <div className="grid grid-cols-2 gap-6">
                <div className="card glass" style={{ padding: '24px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🛒</div>
                    <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '8px' }}>E-Ticaret</h3>
                    <p style={{ fontSize: '13px', opacity: 0.6, marginBottom: '16px' }}>
                        Online mağazanızı entegre edin
                    </p>
                    <div style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', display: 'inline-block' }}>
                        Yakında
                    </div>
                </div>

                <div className="card glass" style={{ padding: '24px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>💼</div>
                    <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '8px' }}>Muhasebe</h3>
                    <p style={{ fontSize: '13px', opacity: 0.6, marginBottom: '16px' }}>
                        Muhasebe yazılımınızla senkronize olun
                    </p>
                    <div style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', display: 'inline-block' }}>
                        Yakında
                    </div>
                </div>

                <div className="card glass" style={{ padding: '24px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📧</div>
                    <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '8px' }}>E-posta</h3>
                    <p style={{ fontSize: '13px', opacity: 0.6, marginBottom: '16px' }}>
                        SMTP ayarlarınızı yapılandırın
                    </p>
                    <div style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', display: 'inline-block' }}>
                        Yakında
                    </div>
                </div>

                <div className="card glass" style={{ padding: '24px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📱</div>
                    <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '8px' }}>SMS</h3>
                    <p style={{ fontSize: '13px', opacity: 0.6, marginBottom: '16px' }}>
                        SMS bildirimleri gönderin
                    </p>
                    <div style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', display: 'inline-block' }}>
                        Yakında
                    </div>
                </div>
            </div>
        </div>
    );
}
