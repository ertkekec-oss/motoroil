"use client";

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';

interface SuspiciousEvent {
    id: string;
    timestamp: Date;
    detectedPhrase: string;
    confidence: number;
    hasSaleInLast5Min: boolean;
    branch: string;
    staff: string;
}

interface SalesMonitorProps {
    userRole: 'Admin' | 'Personel';
    currentBranch: string;
    currentStaff: string;
    onSuspiciousActivity?: (event: SuspiciousEvent) => void;
}

export default function SalesMonitor({
    userRole,
    currentBranch,
    currentStaff,
    onSuspiciousActivity
}: SalesMonitorProps) {
    const { lastSaleTime, addSuspiciousEvent, suspiciousEvents } = useApp();
    const { showError } = useModal();
    const [isListening, setIsListening] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [detectedText, setDetectedText] = useState('');
    const recognitionRef = useRef<any>(null);

    // Şüpheli kelimeler listesi
    const suspiciousWords = [
        'hayırlı olsun',
        'hayırlı',
        'kolay gelsin',
        'allah kabul etsin',
        'güle güle kullan',
        'sağlıklı günlerde kullan',
        'geçmiş olsun',
        'afiyet olsun',
        'allah razı olsun',
        'teşekkür ederim',
        'teşekkürler',
        'sağ ol',
        'iyi günlerde kullan',
        'hayırlı işler'
    ];

    useEffect(() => {
        // Web Speech API desteği kontrolü
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Ses tanıma bu tarayıcıda desteklenmiyor. Lütfen Chrome veya Edge kullanın.');
            return;
        }

        // Ses tanıma nesnesini oluştur
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'tr-TR';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            console.log('🎤 Ses tanıma başlatıldı...');
        };

        recognition.onend = () => {
            setIsListening(false);
            console.log('🎤 Ses tanıma durduruldu.');

            // Eğer hala aktifse, yeniden başlat
            if (isEnabled) {
                setTimeout(() => {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.log('Ses tanıma yeniden başlatılamadı:', e);
                    }
                }, 1000);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Ses tanıma hatası:', event.error);
            if (event.error === 'no-speech') {
                // Sessizlik hatası, normal - yeniden başlat
                setTimeout(() => {
                    if (isEnabled) {
                        try {
                            recognition.start();
                        } catch (e) {
                            // Zaten çalışıyor olabilir
                        }
                    }
                }, 1000);
            }
        };

        recognition.onresult = (event: any) => {
            const last = event.results.length - 1;
            const transcript = event.results[last][0].transcript.toLowerCase().trim();
            const confidence = event.results[last][0].confidence;

            setDetectedText(transcript);

            // Şüpheli kelime kontrolü
            const detectedSuspicious = suspiciousWords.find(word =>
                transcript.includes(word)
            );

            if (detectedSuspicious && confidence > 0.6) {
                console.log('⚠️ Şüpheli kelime tespit edildi:', detectedSuspicious);
                handleSuspiciousPhrase(detectedSuspicious, confidence);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [isEnabled]);

    const handleSuspiciousPhrase = (phrase: string, confidence: number) => {
        // Son 5 dakikada satış var mı kontrol et
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const hasSaleInLast5Min = lastSaleTime ? lastSaleTime > fiveMinutesAgo : false;

        const event: SuspiciousEvent = {
            id: `${Date.now()}-${Math.random()}`,
            timestamp: now,
            detectedPhrase: phrase,
            confidence: confidence,
            hasSaleInLast5Min: hasSaleInLast5Min,
            branch: currentBranch,
            staff: currentStaff
        };

        // Eğer son 5 dakikada satış yoksa, şüpheli!
        if (!hasSaleInLast5Min) {
            // Push to global context (this notifies admin tabs)
            addSuspiciousEvent(event);

            if (onSuspiciousActivity) {
                onSuspiciousActivity(event);
            }

            if (userRole === 'Admin' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('⚠️ Şüpheli Satış Tespiti', {
                    body: `"${phrase}" - ${currentBranch} - ${currentStaff}`,
                    icon: '/favicon.ico',
                    tag: event.id,
                    requireInteraction: true
                });
            }

            console.warn('🚨 ŞÜPHELİ DURUM:', { phrase, confidence, branch: currentBranch, staff: currentStaff, time: now.toLocaleTimeString('tr-TR') });
        }
    };

    const toggleMonitoring = async () => {
        if (!isEnabled) {
            // Web Speech API desteği kontrolü
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                showError('Desteklenmeyen Tarayıcı', '⚠️ Ses tanıma bu tarayıcıda desteklenmiyor!\n\nLütfen Google Chrome veya Microsoft Edge kullanın.');
                return;
            }

            console.log('🎤 Mikrofon izni isteniyor...');

            // Mikrofon izni iste
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });

                console.log('✅ Mikrofon izni alındı!', stream);

                // Stream'i hemen kapat (sadece izin için kullandık)
                stream.getTracks().forEach(track => {
                    track.stop();
                    console.log('Mikrofon track durduruldu:', track.label);
                });

                // Bildirim izni iste (sadece admin için)
                if (userRole === 'Admin' && 'Notification' in window) {
                    if (Notification.permission === 'default') {
                        console.log('🔔 Bildirim izni isteniyor...');
                        const permission = await Notification.requestPermission();
                        console.log('Bildirim izni sonucu:', permission);
                    }
                }

                setIsEnabled(true);

                // Ses tanımayı başlat
                setTimeout(() => {
                    try {
                        if (recognitionRef.current) {
                            recognitionRef.current.start();
                            console.log('🎤 Ses tanıma başlatıldı!');
                        }
                    } catch (e: any) {
                        console.error('Ses tanıma başlatma hatası:', e);
                        if (e.message.includes('already started')) {
                            console.log('Ses tanıma zaten çalışıyor.');
                        }
                    }
                }, 300);

            } catch (error: any) {
                console.error('❌ Mikrofon erişim hatası:', error);

                let errorMessage = '⚠️ Mikrofon erişimi başarısız!\n\n';

                if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    errorMessage += 'Mikrofon izni reddedildi.\n\n';
                    errorMessage += 'ÇÖZÜM:\n';
                    errorMessage += '1. Tarayıcı adres çubuğundaki 🔒 kilit ikonuna tıklayın\n';
                    errorMessage += '2. "Mikrofon" iznini "İzin Ver" olarak değiştirin\n';
                    errorMessage += '3. Sayfayı yenileyin (F5)\n';
                    errorMessage += '4. Tekrar "▶ Başlat" butonuna tıklayın\n\n';
                    errorMessage += 'NOT: İzin vermek zorundasınız, aksi halde sistem çalışmaz.';
                } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                    errorMessage += 'Mikrofon bulunamadı!\n\n';
                    errorMessage += 'ÇÖZÜM:\n';
                    errorMessage += '1. Bilgisayarınıza mikrofon bağlayın\n';
                    errorMessage += '2. Windows Ayarlar → Ses → Mikrofon kontrolünü yapın\n';
                    errorMessage += '3. Mikrofon çalışıyorsa sayfayı yenileyin';
                } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                    errorMessage += 'Mikrofon kullanımda!\n\n';
                    errorMessage += 'ÇÖZÜM:\n';
                    errorMessage += '1. Başka bir uygulama mikrofonu kullanıyor olabilir\n';
                    errorMessage += '2. Zoom, Teams, Skype gibi uygulamaları kapatın\n';
                    errorMessage += '3. Sayfayı yenileyin ve tekrar deneyin';
                } else {
                    errorMessage += 'Bilinmeyen hata:\n' + error.message + '\n\n';
                    errorMessage += 'Tarayıcı konsolunu (F12) kontrol edin.';
                }

                showError('Mikrofon Hatası', errorMessage);
            }
        } else {
            setIsEnabled(false);
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                console.log('⏸ Ses tanıma durduruldu.');
            }
        }
    };

    // Removal of recordSale local logic as it's now in AppContext

    if (userRole !== 'Admin') {
        // Personel sayfasında ikon çıkmasın - gizli dinleme modu
        return null;
    }

    // Admin için açılır/kapanır buton
    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="sales-monitor-btn"
                style={{
                    background: isListening ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                    animation: isListening ? 'pulse 2s infinite' : 'none'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                }}
            >
                {isListening ? '🔴' : '🎤'}
            </button>

            {/* Badge - Şüpheli olay sayısı */}
            {suspiciousEvents.length > 0 && (
                <div className="sales-monitor-badge">
                    {suspiciousEvents.length}
                </div>
            )}

            {/* Expanded Panel */}
            {isExpanded && (
                <div className="sales-monitor-panel">
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>🎤 Satış Monitörü</h4>
                            <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)' }}>Kaçak satış tespiti</p>
                        </div>
                        <button
                            onClick={toggleMonitoring}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: isEnabled ? 'var(--danger)' : 'var(--success)',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 'bold'
                            }}
                        >
                            {isEnabled ? '⏸ Durdur' : '▶ Başlat'}
                        </button>
                    </div>

                    {/* Status */}
                    <div style={{
                        padding: '10px',
                        background: isListening ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 100, 100, 0.1)',
                        borderRadius: '8px',
                        border: `1px solid ${isListening ? 'var(--danger)' : 'var(--border-light)'}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '16px' }}>{isListening ? '🔴' : '⚫'}</span>
                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                {isListening ? 'DİNLENİYOR...' : 'KAPALI'}
                            </span>
                        </div>
                        {detectedText && (
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Son: "{detectedText.substring(0, 50)}..."
                            </div>
                        )}
                    </div>

                    {/* Şüpheli Olaylar */}
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px' }}>
                        <h5 style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            ⚠️ ŞÜPHELİ OLAYLAR ({suspiciousEvents.length})
                        </h5>
                        {suspiciousEvents.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '11px' }}>
                                Henüz şüpheli olay tespit edilmedi
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {suspiciousEvents.slice(0, 10).map(event => (
                                    <div
                                        key={event.id}
                                        style={{
                                            padding: '10px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid var(--danger)',
                                            borderRadius: '6px',
                                            fontSize: '11px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 'bold', color: 'var(--danger)' }}>
                                                "{event.detectedPhrase}"
                                            </span>
                                            <span style={{ color: 'var(--text-muted)' }}>
                                                {event.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                                            📍 {event.branch} • 👤 {event.staff}
                                        </div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '4px' }}>
                                            Güven: %{Math.round(event.confidence * 100)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div style={{
                        fontSize: '9px',
                        color: 'var(--text-muted)',
                        borderTop: '1px solid var(--border-light)',
                        paddingTop: '8px',
                        lineHeight: '1.4'
                    }}>
                        💡 Sistem şüpheli kelimeleri dinler. Son 5 dakikada satış kaydı yoksa uyarı verir.
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3); }
                    50% { box-shadow: 0 4px 30px rgba(239, 68, 68, 0.6); }
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </>
    );
}
