
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
    const [companyData, setCompanyData] = useState({
        name: '',
        slogan: '',
        vkn: '',
        taxOffice: '',
        address: '',
        city: 'İstanbul',
        district: '',
        email: '',
        website: '',
        phone: ''
    });

    const [branchData, setBranchData] = useState({
        branchName: 'Merkez Şube',
        warehouseName: 'Ana Depo'
    });

    const [financeData, setFinanceData] = useState({
        createDefaultKasa: true,
        createDefaultBank: true,
        kasaName: 'Merkez Nakit Kasası',
        bankName: 'Ana Banka Hesabı (TL)'
    });

    const [integrations, setIntegrations] = useState({
        eInvoice: false,
        bank: false,
        ecommerce: false,
        b2bNetwork: false
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
                    company: companyData,
                    branch: branchData,
                    finance: financeData,
                    integrations: integrations
                })
            });

            const result = await res.json();
            if (result.success) {
                updateUser({ setupState: 'COMPLETED' });
                showSuccess('Başarılı', 'Kurulum tamamlandı! Sisteme yönlendiriliyorsunuz...');
                setTimeout(() => {
                    router.push('/dashboard');
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
                    background: radial-gradient(circle at top right, #0f172a, #020617);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Outfit', sans-serif;
                    color: white;
                    padding: 20px;
                }
                .bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm-card {
                    background: rgba(30, 41, 59, 0.5);
                    
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 32px;
                    padding: 48px;
                    width: 100%;
                    max-width: 600px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.05);
                }
                .step-indicator {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 40px;
                    position: relative;
                }
                .step-indicator::before {
                    content: '';
                    position: absolute;
                    top: 15px;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: rgba(255, 255, 255, 0.05);
                    z-index: 1;
                }
                .step-dot {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #1e293b;
                    border: 2px solid #334155;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 800;
                    position: relative;
                    z-index: 2;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .step-dot.active {
                    background: #3b82f6;
                    border-color: #60a5fa;
                    box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
                    color: white;
                }
                .step-dot.completed {
                    background: #10b981;
                    border-color: #34d399;
                    color: white;
                }
                h1 { 
                    font-size: 32px; 
                    margin-bottom: 12px; 
                    font-weight: 900; 
                    letter-spacing: -0.025em;
                    background: linear-gradient(to bottom right, #fff, #94a3b8); 
                    -webkit-background-clip: text; 
                    -webkit-text-fill-color: transparent; 
                }
                p { color: #94a3b8; margin-bottom: 32px; line-height: 1.6; font-size: 15px; }
                .input-grid {
                    display: grid;
                    grid-template-cols: 1fr 1fr;
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .input-group { margin-bottom: 20px; text-align: left; }
                label { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
                input, select, textarea {
                    width: 100%;
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 14px;
                    padding: 14px 18px;
                    color: white;
                    outline: none;
                    font-size: 14px;
                    transition: all 0.2s;
                    font-weight: 500;
                }
                input:focus, select:focus { 
                    border-color: #3b82f6; 
                    background: rgba(15, 23, 42, 0.8);
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                }
                .toggle-card {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    background: rgba(15, 23, 42, 0.4);
                    padding: 24px;
                    border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all 0.2s;
                    cursor: pointer;
                    margin-bottom: 16px;
                }
                .toggle-card:hover {
                    background: rgba(15, 23, 42, 0.6);
                    border-color: rgba(255,255,255,0.1);
                }
                .toggle-card.active {
                    background: rgba(59, 130, 246, 0.1);
                    border-color: rgba(59, 130, 246, 0.3);
                }
                .icon-box {
                    width: 52px;
                    height: 52px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                }
                button {
                    padding: 16px;
                    border-radius: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s;
                    border: none;
                    font-size: 14px;
                    letter-spacing: 0.02em;
                }
                .btn-next { background: #3b82f6; color: white; margin-top: 10px; width: 100%; }
                .btn-next:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 24px -10px rgba(59, 130, 246, 0.5); background: #2563eb; }
                .btn-next:disabled { opacity: 0.5; cursor: not-allowed; }
                .btn-back { background: transparent; color: #64748b; margin-top: 12px; width: 100%; }
                .btn-back:hover { color: white; background: rgba(255,255,255,0.05); }
                
                .integration-option {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px;
                    background: rgba(15, 23, 42, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    margin-bottom: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .integration-option:hover { background: rgba(15, 23, 42, 0.7); border-color: rgba(255,255,255,0.1); }
                .integration-option.selected { border-color: #3b82f6; background: rgba(59, 130, 246, 0.05); }
                .checkbox-custom {
                    width: 24px;
                    height: 24px;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .selected .checkbox-custom { background: #3b82f6; border-color: #3b82f6; }
            `}</style>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm-card">
                <div className="step-indicator">
                    {[1, 2, 3, 4, 5].map(s => (
                        <div
                            key={s}
                            className={`step-dot ${step === s ? 'active' : step > s ? 'completed' : ''}`}
                        >
                            {step > s ? '✓' : s}
                        </div>
                    ))}
                </div>

                {/* STEP 1: FİRMA PROFİLİ */}
                {step === 1 && (
                    <div className="step-content">
                        <h1>Firma Profili 🏢</h1>
                        <p>İşletmenizin yasal bilgilerini kaydederek başlayalım. Bu bilgiler e-fatura ve resmi belgelerde kullanılacaktır.</p>

                        <div className="input-group">
                            <label>Firma Ünvanı</label>
                            <input
                                type="text"
                                placeholder="Örn: Periodya Teknoloji Ltd. Şti."
                                value={companyData.name}
                                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <label>Slogan / Alt Başlık</label>
                            <input
                                type="text"
                                placeholder="Örn: Profesyonel Oto Servis ve Bakım"
                                value={companyData.slogan}
                                onChange={(e) => setCompanyData({ ...companyData, slogan: e.target.value })}
                            />
                        </div>

                        <div className="input-grid">
                            <div className="input-group">
                                <label>VKN / TCKN</label>
                                <input
                                    type="text"
                                    maxLength={11}
                                    placeholder="10 veya 11 hane"
                                    value={companyData.vkn}
                                    onChange={(e) => setCompanyData({ ...companyData, vkn: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Vergi Dairesi</label>
                                <input
                                    type="text"
                                    placeholder="Örn: Mecidiyeköy"
                                    value={companyData.taxOffice}
                                    onChange={(e) => setCompanyData({ ...companyData, taxOffice: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="input-grid">
                            <div className="input-group">
                                <label>Şehir</label>
                                <select
                                    value={companyData.city}
                                    onChange={(e) => setCompanyData({ ...companyData, city: e.target.value, district: '' })}
                                >
                                    {TURKISH_CITIES.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>İlçe</label>
                                <select
                                    value={companyData.district}
                                    onChange={(e) => setCompanyData({ ...companyData, district: e.target.value })}
                                    disabled={!companyData.city}
                                >
                                    <option value="">İlçe Seçin...</option>
                                    {(TURKISH_DISTRICTS[companyData.city] || []).map(district => (
                                        <option key={district} value={district}>{district}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="input-grid">
                            <div className="input-group">
                                <label>Genel E-posta</label>
                                <input
                                    type="email"
                                    placeholder="info@firma.com"
                                    value={companyData.email}
                                    onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Web Sitesi</label>
                                <input
                                    type="text"
                                    placeholder="www.firma.com.tr"
                                    value={companyData.website}
                                    onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Varsayılan Adres (Şube Bilgisi Yoksa)</label>
                            <textarea
                                rows={2}
                                placeholder="Firma açık adresi..."
                                value={companyData.address}
                                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                                style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '14px', width: '100%', color: 'white', padding: '14px' }}
                            />
                        </div>

                        <div className="input-group">
                            <label>Varsayılan Telefon</label>
                            <input
                                type="text"
                                placeholder="+90 (---) --- -- --"
                                value={companyData.phone}
                                onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                            />
                        </div>

                        <button className="btn-next" onClick={handleNext} disabled={!companyData.name || !companyData.vkn}>
                            Devam Et
                        </button>
                    </div>
                )}

                {/* STEP 2: ŞUBE & DEPO */}
                {step === 2 && (
                    <div className="step-content">
                        <h1>Şube ve Depo 📍</h1>
                        <p>Satış yapacağınız ana şubeyi ve stokları tutacağınız varsayılan depoyu tanımlayın.</p>

                        <div className="input-group">
                            <label>Ana Şube Adı</label>
                            <input
                                type="text"
                                placeholder="Örn: Merkez Şube"
                                value={branchData.branchName}
                                onChange={(e) => setBranchData({ ...branchData, branchName: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <label>Varsayılan Depo Adı</label>
                            <input
                                type="text"
                                placeholder="Örn: Ana Depo"
                                value={branchData.warehouseName}
                                onChange={(e) => setBranchData({ ...branchData, warehouseName: e.target.value })}
                            />
                        </div>

                        <button className="btn-next" onClick={handleNext} disabled={!branchData.branchName || !branchData.warehouseName}>
                            Devam Et
                        </button>
                        <button className="btn-back" onClick={handlePrev}>Geri Dön</button>
                    </div>
                )}

                {/* STEP 3: KASALAR */}
                {step === 3 && (
                    <div className="step-content">
                        <h1>Kasa ve Banka 🏦</h1>
                        <p>Nakit ve banka ödemelerinizi takip etmek için ilk hesaplarınızı oluşturalım.</p>

                        <div
                            className={`toggle-card ${financeData.createDefaultKasa ? 'active' : ''}`}
                            onClick={() => setFinanceData({ ...financeData, createDefaultKasa: !financeData.createDefaultKasa })}
                        >
                            <div className="icon-box">💵</div>
                            <div style={{ flex: 1, textAlign: 'left' }}>
                                <div style={{ fontWeight: 800, fontSize: '14px' }}>Nakit Kasa Oluşturulsun</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>"{financeData.kasaName}" isminde bir kasa açılır.</div>
                            </div>
                            <div className="checkbox-custom" style={{ background: financeData.createDefaultKasa ? '#3b82f6' : 'transparent', borderColor: financeData.createDefaultKasa ? '#3b82f6' : 'rgba(255,255,255,0.1)' }}>{financeData.createDefaultKasa && '✓'}</div>
                        </div>

                        <div
                            className={`toggle-card ${financeData.createDefaultBank ? 'active' : ''}`}
                            onClick={() => setFinanceData({ ...financeData, createDefaultBank: !financeData.createDefaultBank })}
                        >
                            <div className="icon-box">🏦</div>
                            <div style={{ flex: 1, textAlign: 'left' }}>
                                <div style={{ fontWeight: 800, fontSize: '14px' }}>Banka Hesabı Oluşturulsun</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>"{financeData.bankName}" isminde bir hesap açılır.</div>
                            </div>
                            <div className="checkbox-custom" style={{ background: financeData.createDefaultBank ? '#3b82f6' : 'transparent', borderColor: financeData.createDefaultBank ? '#3b82f6' : 'rgba(255,255,255,0.1)' }}>{financeData.createDefaultBank && '✓'}</div>
                        </div>

                        <button className="btn-next" onClick={handleNext}>
                            Devam Et
                        </button>
                        <button className="btn-back" onClick={handlePrev}>Geri Dön</button>
                    </div>
                )}

                {/* STEP 4: ENTEGRASYON GÜCÜ */}
                {step === 4 && (
                    <div className="step-content">
                        <h1>Entegrasyon Gücü ⚡</h1>
                        <p>İşletmenizi dijital dünyaya bağlayın. Seçtiğiniz modüller kurulum sonrası aktif edilecektir.</p>

                        <div
                            className={`integration-option ${integrations.eInvoice ? 'selected' : ''}`}
                            onClick={() => setIntegrations({ ...integrations, eInvoice: !integrations.eInvoice })}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div className="icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>📄</div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 800, fontSize: '14px' }}>E-Fatura Entegrasyonu</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Nilvera ile e-fatura/e-arşiv süreçleri.</div>
                                </div>
                            </div>
                            <div className="checkbox-custom">{integrations.eInvoice && '✓'}</div>
                        </div>

                        <div
                            className={`integration-option ${integrations.bank ? 'selected' : ''}`}
                            onClick={() => setIntegrations({ ...integrations, bank: !integrations.bank })}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div className="icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>💳</div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 800, fontSize: '14px' }}>Banka Entegrasyonu</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Banka hareketlerini anlık takip edin.</div>
                                </div>
                            </div>
                            <div className="checkbox-custom">{integrations.bank && '✓'}</div>
                        </div>

                        <div
                            className={`integration-option ${integrations.ecommerce ? 'selected' : ''}`}
                            onClick={() => setIntegrations({ ...integrations, ecommerce: !integrations.ecommerce })}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div className="icon-box" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>📦</div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 800, fontSize: '14px' }}>E-Ticaret Entegrasyonu</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Pazaryeri ve web sitenizi bağlayın.</div>
                                </div>
                            </div>
                            <div className="checkbox-custom">{integrations.ecommerce && '✓'}</div>
                        </div>

                        <div
                            className={`integration-option ${integrations.b2bNetwork ? 'selected' : ''}`}
                            onClick={() => setIntegrations({ ...integrations, b2bNetwork: !integrations.b2bNetwork })}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div className="icon-box" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>🤝</div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 800, fontSize: '14px' }}>B2B Dealer Network</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Bayi sipariş portalı ve sanal POS.</div>
                                </div>
                            </div>
                            <div className="checkbox-custom">{integrations.b2bNetwork && '✓'}</div>
                        </div>

                        <button className="btn-next" onClick={handleNext}>
                            Son Adıma Geç
                        </button>
                        <button className="btn-back" onClick={handlePrev}>Geri Dön</button>
                    </div>
                )}

                {/* STEP 5: ÖZET & TAMAMLAMA */}
                {step === 5 && (
                    <div className="step-content" style={{ textAlign: 'center' }}>
                        <div className="icon-box" style={{ width: '80px', height: '80px', margin: '0 auto 24px', fontSize: '40px', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>🚀</div>
                        <h1>Hazırız!</h1>
                        <p>Tüm ayarlarınız yapılandırıldı. Periodya paneline giriş yapmak için hazırsınız.</p>

                        <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '24px', borderRadius: '24px', textAlign: 'left', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Firma:</span>
                                <span style={{ fontWeight: 700, fontSize: '14px' }}>{companyData.name}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Şube:</span>
                                <span style={{ fontWeight: 700, fontSize: '14px' }}>{branchData.branchName}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Entegrasyonlar:</span>
                                <span style={{ fontWeight: 700, fontSize: '14px', color: '#3b82f6' }}>
                                    {[
                                        integrations.eInvoice ? 'E-Fatura' : '',
                                        integrations.bank ? 'Banka' : '',
                                        integrations.ecommerce ? 'E-Ticaret' : '',
                                        integrations.b2bNetwork ? 'B2B Ağ' : ''
                                    ].filter(Boolean).join(', ') || 'Atlandı'}
                                </span>
                            </div>
                        </div>

                        <button className="btn-next" onClick={handleComplete} disabled={loading}>
                            {loading ? 'Kurulum Başlatılıyor...' : 'Kurulumu Tamamla'}
                        </button>
                        {!loading && <button className="btn-back" onClick={handlePrev}>Geri Dön</button>}
                    </div>
                )}
            </div>
        </div>
    );
}
