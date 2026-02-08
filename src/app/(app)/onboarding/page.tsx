
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';
import { useAuth } from '@/contexts/AuthContext';
import { TURKISH_CITIES, TURKISH_DISTRICTS } from '@/lib/constants';

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { showSuccess, showError } = useModal();
    const { updateUser } = useAuth();

    // Form States
    const [branchData, setBranchData] = useState({
        name: '',
        city: 'İstanbul',
        district: '',
        address: ''
    });

    const [financeData, setFinanceData] = useState({
        createDefaultKasa: true,
        createDefaultBank: true
    });

    const handleNext = () => setStep(step + 1);
    const handlePrev = () => setStep(step - 1);

    const handleComplete = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/onboarding/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    branchName: branchData.name,
                    city: branchData.city,
                    district: branchData.district,
                    address: branchData.address,
                    createDefaultKasa: financeData.createDefaultKasa,
                    createDefaultBank: financeData.createDefaultBank
                })
            });

            const result = await res.json();
            if (result.success) {
                // Update local auth state to prevent redirection loop
                updateUser({ setupState: 'COMPLETED' });

                showSuccess('Başarılı', 'Kurulum tamamlandı! Sisteme yönlendiriliyorsunuz...');
                setTimeout(() => {
                    router.push('/');
                }, 2000);
            } else {
                showError('Hata', result.error || 'Bir hata oluştu');
            }
        } catch (error) {
            showError('Hata', 'Sunucuya bağlanılamadı');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="onboarding-container">
            <style jsx>{`
                .onboarding-container {
                    min-height: 100vh;
                    background: radial-gradient(circle at top right, #1a1c2c, #0d0e14);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Inter', sans-serif;
                    color: white;
                    padding: 20px;
                }
                .glass-card {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 40px;
                    width: 100%;
                    max-width: 500px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                .step-indicator {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    margin-bottom: 30px;
                }
                .dot {
                    width: 40px;
                    height: 6px;
                    border-radius: 3px;
                    background: rgba(255, 255, 255, 0.1);
                    transition: all 0.3s ease;
                }
                .dot.active {
                    background: #446ee7;
                    box-shadow: 0 0 15px rgba(68, 110, 231, 0.5);
                }
                h1 { font-size: 28px; margin-bottom: 10px; font-weight: 800; background: linear-gradient(to right, #fff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                p { color: #94a3b8; margin-bottom: 30px; line-height: 1.6; }
                .input-group { margin-bottom: 20px; }
                label { display: block; margin-bottom: 8px; font-size: 14px; color: #cbd5e1; }
                input, select {
                    width: 100%;
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 12px 16px;
                    color: white;
                    outline: none;
                }
                input:focus { border-color: #446ee7; }
                .toggle-box {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(255, 255, 255, 0.03);
                    padding: 16px;
                    border-radius: 16px;
                    margin-bottom: 15px;
                }
                button {
                    width: 100%;
                    padding: 14px;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }
                .btn-primary { background: #446ee7; color: white; margin-top: 10px; }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -10px #446ee7; }
                .btn-secondary { background: transparent; color: #94a3b8; margin-top: 10px; }
                .btn-secondary:hover { color: white; }
                .success-icon { font-size: 60px; text-align: center; margin-bottom: 20px; }
            `}</style>

            <div className="glass-card">
                <div className="step-indicator">
                    <div className={`dot ${step >= 1 ? 'active' : ''}`}></div>
                    <div className={`dot ${step >= 2 ? 'active' : ''}`}></div>
                    <div className={`dot ${step >= 3 ? 'active' : ''}`}></div>
                    <div className={`dot ${step >= 4 ? 'active' : ''}`}></div>
                </div>

                {step === 1 && (
                    <div className="step-content">
                        <h1>Şubenizi Kuralım 🏢</h1>
                        <p>İşletmenizin ana şubesini tanımlayarak başlayın. Daha sonra yeni şubeler ekleyebilirsiniz.</p>

                        <div className="input-group">
                            <label>Şube Adı</label>
                            <input
                                type="text"
                                placeholder="Örn: Merkez Şube"
                                value={branchData.name}
                                onChange={(e) => setBranchData({ ...branchData, name: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <label>Şehir</label>
                            <select
                                value={branchData.city}
                                onChange={(e) => setBranchData({ ...branchData, city: e.target.value, district: '' })}
                            >
                                <option value="">Şehir Seçin...</option>
                                {TURKISH_CITIES.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label>İlçe</label>
                            <select
                                value={branchData.district}
                                onChange={(e) => setBranchData({ ...branchData, district: e.target.value })}
                                disabled={!branchData.city}
                            >
                                <option value="">İlçe Seçin...</option>
                                {(TURKISH_DISTRICTS[branchData.city] || []).map(district => (
                                    <option key={district} value={district}>{district}</option>
                                ))}
                            </select>
                        </div>

                        <button className="btn-primary" onClick={handleNext} disabled={!branchData.name}>
                            Devam Et
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-content">
                        <h1>Finansal Başlangıç 💰</h1>
                        <p>Kasa ve banka hesaplarınızı otomatik oluşturarak hemen satış yapmaya hazır hale gelebilirsiniz.</p>

                        <div className="toggle-box">
                            <div>
                                <div style={{ fontWeight: 600 }}>Merkez Nakit Kasası</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Nakit satışlarınız için varsayılan kasa.</div>
                            </div>
                            <input
                                type="checkbox"
                                style={{ width: '24px', height: '24px' }}
                                checked={financeData.createDefaultKasa}
                                onChange={(e) => setFinanceData({ ...financeData, createDefaultKasa: e.target.checked })}
                            />
                        </div>

                        <div className="toggle-box">
                            <div>
                                <div style={{ fontWeight: 600 }}>Ana Banka Hesabı</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Havale/EFT ödemeleri için sanal banka.</div>
                            </div>
                            <input
                                type="checkbox"
                                style={{ width: '24px', height: '24px' }}
                                checked={financeData.createDefaultBank}
                                onChange={(e) => setFinanceData({ ...financeData, createDefaultBank: e.target.checked })}
                            />
                        </div>

                        <button className="btn-primary" onClick={handleNext}>
                            Devam Et
                        </button>
                        <button className="btn-secondary" onClick={handlePrev}>Geri Dön</button>
                    </div>
                )}

                {step === 3 && (
                    <div className="step-content">
                        <h1>Entegrasyon Gücü ⚡</h1>
                        <p>E-fatura veya pazaryeri entegrasyonu kullanmak istiyor musunuz? (Daha sonra da açabilirsiniz)</p>

                        <div className="toggle-box" style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => handleNext()}>
                            <div>
                                <div style={{ fontWeight: 600 }}>🚀 E-Fatura Kullanacağım</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Nilvera entegrasyonu ile dijital dönüşüm.</div>
                            </div>
                            <div style={{ fontSize: '20px' }}>➔</div>
                        </div>

                        <div className="toggle-box" style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => handleNext()}>
                            <div>
                                <div style={{ fontWeight: 600 }}>📦 Pazaryeri Bağlayacağım</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Trendyol, Hepsiburada vb. sipariş yönetimi.</div>
                            </div>
                            <div style={{ fontSize: '20px' }}>➔</div>
                        </div>

                        <button className="btn-secondary" style={{ marginTop: '20px' }} onClick={handleNext}>
                            Şimdilik Atla
                        </button>
                        <button className="btn-secondary" onClick={handlePrev}>Geri Dön</button>
                    </div>
                )}

                {step === 4 && (
                    <div className="step-content" style={{ textAlign: 'center' }}>
                        <div className="success-icon">🚀</div>
                        <h1>Her Şey Hazır!</h1>
                        <p>Şubeniz ve temel hesaplarınız kurulmak üzere. Onayladığınızda Periodya dünyasına giriş yapacaksınız.</p>

                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', textAlign: 'left', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ color: '#94a3b8' }}>Şube:</span>
                                <span style={{ fontWeight: 600 }}>{branchData.name} ({branchData.city}{branchData.district ? ` / ${branchData.district}` : ''})</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>Hesaplar:</span>
                                <span style={{ fontWeight: 600 }}>
                                    {[
                                        financeData.createDefaultKasa ? 'Nakit Kasa' : '',
                                        financeData.createDefaultBank ? 'Banka Hesabı' : ''
                                    ].filter(Boolean).join(', ') || 'Atlandı'}
                                </span>
                            </div>
                        </div>

                        <button className="btn-primary" onClick={handleComplete} disabled={loading}>
                            {loading ? 'Kuruluyor...' : 'Kurulumu Tamamla ve Başla'}
                        </button>
                        {!loading && <button className="btn-secondary" onClick={handlePrev}>Geri Dön</button>}
                    </div>
                )}
            </div>
        </div>
    );
}
