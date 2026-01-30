"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [setupData, setSetupData] = useState({
        // Database Settings
        dbHost: 'localhost',
        dbPort: '3306',
        dbName: 'motoroil_db',
        dbUser: 'root',
        dbPassword: '',

        // Admin Account
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        adminPasswordConfirm: '',

        // Company Info
        companyName: 'MOTOROIL',
        companyAddress: '',
        companyPhone: '',
        companyTaxNo: '',

        // Initial Settings
        currency: 'TRY',
        timezone: 'Europe/Istanbul',
        language: 'tr'
    });

    const [errors, setErrors] = useState<string[]>([]);
    const [isInstalling, setIsInstalling] = useState(false);

    const validateStep = (currentStep: number): boolean => {
        const newErrors: string[] = [];

        if (currentStep === 1) {
            if (!setupData.dbHost) newErrors.push('Veritabanı sunucusu gereklidir');
            if (!setupData.dbName) newErrors.push('Veritabanı adı gereklidir');
            if (!setupData.dbUser) newErrors.push('Veritabanı kullanıcı adı gereklidir');
        }

        if (currentStep === 2) {
            if (!setupData.adminName) newErrors.push('Admin adı gereklidir');
            if (!setupData.adminEmail) newErrors.push('Admin e-posta adresi gereklidir');
            if (!setupData.adminPassword) newErrors.push('Admin şifresi gereklidir');
            if (setupData.adminPassword.length < 6) newErrors.push('Şifre en az 6 karakter olmalıdır');
            if (setupData.adminPassword !== setupData.adminPasswordConfirm) {
                newErrors.push('Şifreler eşleşmiyor');
            }
        }

        if (currentStep === 3) {
            if (!setupData.companyName) newErrors.push('Firma adı gereklidir');
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        setStep(step - 1);
        setErrors([]);
    };

    const handleInstall = async () => {
        if (!validateStep(step)) return;

        setIsInstalling(true);

        try {
            // Real installation via API
            const res = await fetch('/api/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(setupData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Kurulum hatası');
            }

            // Save indicator to localStorage
            localStorage.setItem('motoroil_setup_complete', 'true');
            // We can still store some config locally for UI if needed, but DB is primary
            localStorage.setItem('motoroil_config', JSON.stringify({
                companyName: setupData.companyName,
                adminEmail: setupData.adminEmail
            }));

            setStep(5); // Success step
        } catch (error: any) {
            setErrors([error.message || 'Kurulum sırasında bir hata oluştu. Lütfen tekrar deneyin.']);
            setIsInstalling(false);
        }
    };

    const handleFinish = () => {
        router.push('/');
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '800px',
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '48px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <h1 style={{
                        fontSize: '42px',
                        fontWeight: '900',
                        background: 'linear-gradient(to right, #FF5500, #a78bfa)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '12px'
                    }}>
                        MOTOROIL ERP
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>
                        Kurulum Sihirbazı
                    </p>
                </div>

                {/* Progress Bar */}
                {step < 5 && (
                    <div style={{ marginBottom: '48px' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '16px'
                        }}>
                            {['Veritabanı', 'Admin', 'Firma Bilgileri', 'Kurulum'].map((label, idx) => (
                                <div key={idx} style={{
                                    flex: 1,
                                    textAlign: 'center',
                                    color: step > idx ? '#FF5500' : 'rgba(255,255,255,0.3)',
                                    fontSize: '12px',
                                    fontWeight: '700'
                                }}>
                                    {label}
                                </div>
                            ))}
                        </div>
                        <div style={{
                            height: '4px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '2px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${(step / 4) * 100}%`,
                                background: 'linear-gradient(to right, #FF5500, #a78bfa)',
                                transition: 'width 0.3s'
                            }} />
                        </div>
                    </div>
                )}

                {/* Error Messages */}
                {errors.length > 0 && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '24px'
                    }}>
                        {errors.map((error, idx) => (
                            <div key={idx} style={{ color: '#FF4444', fontSize: '14px', marginBottom: idx < errors.length - 1 ? '8px' : '0' }}>
                                ⚠️ {error}
                            </div>
                        ))}
                    </div>
                )}

                {/* Step 1: Database Settings */}
                {step === 1 && (
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px', color: 'white' }}>
                            📊 Veritabanı Ayarları
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                                    VERİTABANI SUNUCUSU
                                </label>
                                <input
                                    type="text"
                                    value={setupData.dbHost}
                                    onChange={(e) => setSetupData({ ...setupData, dbHost: e.target.value })}
                                    placeholder="localhost"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                                        PORT
                                    </label>
                                    <input
                                        type="text"
                                        value={setupData.dbPort}
                                        onChange={(e) => setSetupData({ ...setupData, dbPort: e.target.value })}
                                        placeholder="3306"
                                        style={{
                                            width: '100%',
                                            padding: '14px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                                        VERİTABANI ADI
                                    </label>
                                    <input
                                        type="text"
                                        value={setupData.dbName}
                                        onChange={(e) => setSetupData({ ...setupData, dbName: e.target.value })}
                                        placeholder="motoroil_db"
                                        style={{
                                            width: '100%',
                                            padding: '14px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                                    KULLANICI ADI
                                </label>
                                <input
                                    type="text"
                                    value={setupData.dbUser}
                                    onChange={(e) => setSetupData({ ...setupData, dbUser: e.target.value })}
                                    placeholder="root"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                                    ŞİFRE
                                </label>
                                <input
                                    type="password"
                                    value={setupData.dbPassword}
                                    onChange={(e) => setSetupData({ ...setupData, dbPassword: e.target.value })}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Admin Account */}
                {step === 2 && (
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px', color: 'white' }}>
                            👤 Yönetici Hesabı
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                                    AD SOYAD
                                </label>
                                <input
                                    type="text"
                                    value={setupData.adminName}
                                    onChange={(e) => setSetupData({ ...setupData, adminName: e.target.value })}
                                    placeholder="Ahmet Yılmaz"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                                    E-POSTA ADRESİ
                                </label>
                                <input
                                    type="email"
                                    value={setupData.adminEmail}
                                    onChange={(e) => setSetupData({ ...setupData, adminEmail: e.target.value })}
                                    placeholder="admin@motoroil.com"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                                    ŞİFRE
                                </label>
                                <input
                                    type="password"
                                    value={setupData.adminPassword}
                                    onChange={(e) => setSetupData({ ...setupData, adminPassword: e.target.value })}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px'
                                    }}
                                />
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
                                    En az 6 karakter olmalıdır
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                                    ŞİFRE TEKRAR
                                </label>
                                <input
                                    type="password"
                                    value={setupData.adminPasswordConfirm}
                                    onChange={(e) => setSetupData({ ...setupData, adminPasswordConfirm: e.target.value })}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Company Info */}
                {step === 3 && (
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px', color: 'white' }}>
                            🏢 Firma Bilgileri
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                                    FİRMA ADI
                                </label>
                                <input
                                    type="text"
                                    value={setupData.companyName}
                                    onChange={(e) => setSetupData({ ...setupData, companyName: e.target.value })}
                                    placeholder="MOTOROIL"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                                    ADRES
                                </label>
                                <textarea
                                    value={setupData.companyAddress}
                                    onChange={(e) => setSetupData({ ...setupData, companyAddress: e.target.value })}
                                    placeholder="Firma adresi..."
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px',
                                        resize: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                                        TELEFON
                                    </label>
                                    <input
                                        type="text"
                                        value={setupData.companyPhone}
                                        onChange={(e) => setSetupData({ ...setupData, companyPhone: e.target.value })}
                                        placeholder="+90 555 123 4567"
                                        style={{
                                            width: '100%',
                                            padding: '14px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                                        VERGİ NO
                                    </label>
                                    <input
                                        type="text"
                                        value={setupData.companyTaxNo}
                                        onChange={(e) => setSetupData({ ...setupData, companyTaxNo: e.target.value })}
                                        placeholder="1234567890"
                                        style={{
                                            width: '100%',
                                            padding: '14px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Installation */}
                {step === 4 && (
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px', color: 'white' }}>
                            🚀 Kuruluma Hazır
                        </h2>
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '12px',
                            padding: '24px',
                            marginBottom: '24px'
                        }}>
                            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.8' }}>
                                <p style={{ marginBottom: '16px' }}>
                                    Kurulum aşağıdaki işlemleri gerçekleştirecek:
                                </p>
                                <ul style={{ paddingLeft: '20px' }}>
                                    <li>✅ Veritabanı tablolarını oluşturma</li>
                                    <li>✅ Başlangıç verilerini yükleme</li>
                                    <li>✅ Yönetici hesabını oluşturma</li>
                                    <li>✅ Sistem ayarlarını kaydetme</li>
                                    <li>✅ Güvenlik yapılandırması</li>
                                </ul>
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '12px',
                            padding: '16px',
                            fontSize: '13px',
                            color: 'rgba(255,255,255,0.7)'
                        }}>
                            💡 <strong>Not:</strong> Kurulum birkaç dakika sürebilir. Lütfen sayfayı kapatmayın.
                        </div>
                    </div>
                )}

                {/* Step 5: Success */}
                {step === 5 && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '72px', marginBottom: '24px' }}>🎉</div>
                        <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '16px', color: 'white' }}>
                            Kurulum Tamamlandı!
                        </h2>
                        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', marginBottom: '32px' }}>
                            MOTOROIL ERP sistemi başarıyla kuruldu ve kullanıma hazır.
                        </p>
                        <div style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '12px',
                            padding: '24px',
                            marginBottom: '32px',
                            textAlign: 'left'
                        }}>
                            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.8' }}>
                                <strong style={{ color: '#10B981' }}>Giriş Bilgileriniz:</strong><br />
                                📧 E-posta: {setupData.adminEmail}<br />
                                🔑 Şifre: (Belirlediğiniz şifre)
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '16px',
                    marginTop: '48px'
                }}>
                    {step > 1 && step < 5 && (
                        <button
                            onClick={handleBack}
                            disabled={isInstalling}
                            style={{
                                flex: 1,
                                padding: '16px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: isInstalling ? 'not-allowed' : 'pointer',
                                opacity: isInstalling ? 0.5 : 1
                            }}
                        >
                            ← Geri
                        </button>
                    )}

                    {step < 4 && (
                        <button
                            onClick={handleNext}
                            style={{
                                flex: 1,
                                padding: '16px',
                                background: 'linear-gradient(to right, #FF5500, #a78bfa)',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            İleri →
                        </button>
                    )}

                    {step === 4 && (
                        <button
                            onClick={handleInstall}
                            disabled={isInstalling}
                            style={{
                                flex: 1,
                                padding: '16px',
                                background: isInstalling ? 'rgba(255,255,255,0.1)' : 'linear-gradient(to right, #10B981, #059669)',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: isInstalling ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isInstalling ? '⏳ Kuruluyor...' : '🚀 Kurulumu Başlat'}
                        </button>
                    )}

                    {step === 5 && (
                        <button
                            onClick={handleFinish}
                            style={{
                                flex: 1,
                                padding: '16px',
                                background: 'linear-gradient(to right, #FF5500, #a78bfa)',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            Sisteme Giriş Yap →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
