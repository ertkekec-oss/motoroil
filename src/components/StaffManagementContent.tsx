"use client";

import { useApp } from '@/contexts/AppContext';

export default function StaffManagementContent() {
    const { staff } = useApp();

    return (
        <div>
            <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Ekip Yönetimi</h2>
            <p style={{ marginBottom: '30px', opacity: 0.7 }}>
                Personel, vardiya, izin, bordro ve performans yönetimi için{' '}
                <a href="/staff" target="_blank" style={{ color: 'var(--primary)', fontWeight: '700' }}>
                    Ekip Yönetimi sayfasını ziyaret edin →
                </a>
            </p>

            <div className="card glass" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '16px' }}>Hızlı Özet</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--primary)' }}>
                            {staff?.length || 0}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '8px' }}>Toplam Personel</div>
                    </div>
                    <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--success)' }}>
                            {staff?.filter(u => u.role !== 'ADMIN').length || 0}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '8px' }}>Aktif Kullanıcı</div>
                    </div>
                    <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--warning)' }}>
                            {staff?.filter(u => u.role === 'ADMIN').length || 0}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '8px' }}>Yönetici</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
