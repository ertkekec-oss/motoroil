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
    userRole: string;
    currentBranch: string;
    currentStaff: string;
    onSuspiciousActivity?: (event: SuspiciousEvent) => void;
}

// Fallback words if none set in DB
const DEFAULT_SUSPICIOUS_WORDS = [
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
    const [error, setError] = useState<string | null>(null);
    const [dynamicWords, setDynamicWords] = useState<string[]>(DEFAULT_SUSPICIOUS_WORDS);
    const recognitionRef = useRef<any>(null);
    const lastResultTimeRef = useRef<number>(0);

    // Fetch dynamic words on mount and when panel is opened
    const refreshWords = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.security_suspicious_words && Array.isArray(data.security_suspicious_words)) {
                setDynamicWords(data.security_suspicious_words);
            }
        } catch (e) {
            console.error('Failed to fetch suspicious words:', e);
        }
    };

    useEffect(() => {
        refreshWords();
    }, []);

    useEffect(() => {
        if (isExpanded) {
            refreshWords();
        }
    }, [isExpanded]);

    // Persist expansion state
    useEffect(() => {
        const savedMonitor = localStorage.getItem('motoroil_monitor_enabled');
        if (savedMonitor === 'true' && userRole === 'Admin') {
            setIsEnabled(true);
        }
    }, [userRole]);

    useEffect(() => {
        // Web Speech API desteği kontrolü
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            const msg = 'Ses tanıma bu tarayıcıda desteklenmiyor. Lütfen Chrome veya Edge kullanın.';
            console.warn(msg);
            setError(msg);
            return;
        }

        const createRecognition = () => {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'tr-TR';
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                setIsListening(true);
                setError(null);
                console.log('🎤 Ses tanıma sistemi aktif.');
            };

            recognition.onend = () => {
                setIsListening(false);
                // Eğer hala aktifse, kısa bir gecikme ile yeniden başlat
                if (isEnabled) {
                    setTimeout(() => {
                        try {
                            if (isEnabled && recognitionRef.current) {
                                recognitionRef.current.start();
                            }
                        } catch (e) {
                            // Zaten çalışıyor olabilir
                        }
                    }, 1000);
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Ses tanıma hatası:', event.error);
                if (event.error === 'not-allowed') {
                    setIsEnabled(false);
                    setError('Mikrofon izni reddedildi.');
                }
            };

            recognition.onresult = (event: any) => {
                const now = Date.now();
                // Debounce results to avoid multiple triggers for the same phrase
                if (now - lastResultTimeRef.current < 1000) return;

                const last = event.results.length - 1;
                const transcript = event.results[last][0].transcript.toLowerCase().trim();
                const confidence = event.results[last][0].confidence;

                if (event.results[last].isFinal) {
                    setDetectedText(transcript);

                    const detectedSuspicious = dynamicWords.find(word =>
                        transcript.includes(word)
                    );

                    if (detectedSuspicious && confidence > 0.4) {
                        lastResultTimeRef.current = now;
                        handleSuspiciousPhrase(detectedSuspicious, confidence);
                    }
                }
            };

            return recognition;
        };

        if (isEnabled && !recognitionRef.current) {
            recognitionRef.current = createRecognition();
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.log('Başlatma hatası:', e);
            }
        } else if (!isEnabled && recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) { }
            recognitionRef.current = null;
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) { }
            }
        };
    }, [isEnabled]);

    const handleSuspiciousPhrase = (phrase: string, confidence: number) => {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const hasSaleInLast5Min = lastSaleTime ? lastSaleTime > fiveMinutesAgo : false;

        const event: SuspiciousEvent = {
            id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: now,
            detectedPhrase: phrase,
            confidence: confidence,
            hasSaleInLast5Min: hasSaleInLast5Min,
            branch: currentBranch,
            staff: currentStaff
        };

        if (!hasSaleInLast5Min) {
            addSuspiciousEvent(event);

            if (onSuspiciousActivity) {
                onSuspiciousActivity(event);
            }

            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('⚠️ Şüpheli İşlem!', {
                    body: `"${phrase}" - ${currentBranch} şubesinde tespit edildi.`,
                    icon: '/favicon.ico',
                    tag: event.id,
                });
            }
        }
    };

    const toggleMonitoring = async () => {
        if (!isEnabled) {
            try {
                // Request mic permission
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());

                // Request notification permission
                if ('Notification' in window) {
                    await Notification.requestPermission();
                }

                setIsEnabled(true);
                localStorage.setItem('motoroil_monitor_enabled', 'true');
            } catch (error: any) {
                console.error('Permission error:', error);
                showError('İzin Gerekli', 'Mikrofon izni verilmeden monitör çalışamaz.');
            }
        } else {
            setIsEnabled(false);
            localStorage.setItem('motoroil_monitor_enabled', 'false');
        }
    };

    // Rendering Logic
    const isAdmin = userRole?.toLowerCase().includes('admin') || userRole === 'SUPER_ADMIN';
    if (!isAdmin) return null;

    return (
        <div className="relative inline-block">
            {/* Inline Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="sales-monitor-inline-btn"
                title="Kaçak Satış Monitörü"
                style={{
                    background: isListening ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                    animation: isListening ? 'pulse 2s infinite' : 'none'
                }}
            >
                {isListening ? '🔴' : '🎤'}
            </button>

            {/* Badge - Şüpheli olay sayısı */}
            {suspiciousEvents.length > 0 && (
                <div className="sales-monitor-inline-badge">
                    {suspiciousEvents.length}
                </div>
            )}

            {/* Expanded Panel */}
            {isExpanded && (
                <div className="sales-monitor-panel">
                    {/* Panel content... */}
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
                                Son: &quot;{detectedText.substring(0, 50)}...&quot;
                            </div>
                        )}
                    </div>

                    {/* Events List */}
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
                                {suspiciousEvents.slice(0, 10)?.map(event => (
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
                                                &quot;{event.detectedPhrase}&quot;
                                            </span>
                                            <span style={{ color: 'var(--text-muted)' }}>
                                                {new Date(event.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                                            📍 {event.branch} • 👤 {event.staff}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

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
                .sales-monitor-inline-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    border: none;
                    color: white;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    flex-shrink: 0;
                }
                .sales-monitor-inline-btn:hover {
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
                }
                .sales-monitor-inline-badge {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    background: #ff3b3b;
                    color: white;
                    font-size: 10px;
                    font-weight: 900;
                    min-width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 9px;
                    z-index: 10;
                    border: 2px solid var(--bg-card);
                    padding: 0 4px;
                }
                .sales-monitor-panel {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    width: 320px;
                    background: var(--bg-card);
                    
                    border: 1px solid var(--border-rich);
                    border-radius: 12px;
                    padding: 16px;
                    z-index: 9998;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                    animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    transform-origin: top right;
                }
                @keyframes pulse {
                    0%, 100% { box-shadow: 0 0 0 0px rgba(239, 68, 68, 0.2); }
                    50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
}
