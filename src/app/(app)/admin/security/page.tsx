"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function SecuritySettingsPage() {
    const [words, setWords] = useState<string[]>([]);
    const [newWord, setNewWord] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.security_suspicious_words) {
                setWords(data.security_suspicious_words);
            } else {
                // Default words if none set
                setWords([
                    'hayırlı olsun',
                    'kolay gelsin',
                    'allah kabul etsin',
                    'güle güle kullan',
                    'afiyet olsun',
                    'teşekkür ederim',
                    'hayırlı işler'
                ]);
            }
        } catch (error) {
            console.error('Settings fetch error:', error);
            toast.error('Ayarlar yüklenirken hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (updatedWords: string[]) => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    security_suspicious_words: updatedWords
                })
            });

            if (res.ok) {
                toast.success('Şüpheli kelimeler güncellendi');
            } else {
                throw new Error('Kaydetme hatası');
            }
        } catch (error) {
            toast.error('Kaydedilemedi');
        } finally {
            setIsSaving(false);
        }
    };

    const addWord = () => {
        if (!newWord.trim()) return;
        const lowercaseWord = newWord.trim().toLowerCase();
        if (words.includes(lowercaseWord)) {
            toast.error('Bu kelime zaten listede');
            return;
        }
        const updated = [...words, lowercaseWord];
        setWords(updated);
        setNewWord('');
        handleSave(updated);
    };

    const removeWord = (word: string) => {
        const updated = words.filter(w => w !== word);
        setWords(updated);
        handleSave(updated);
    };

    if (isLoading) return <div className="p-8 text-slate-500">Yükleniyor...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-outfit">Operasyonel Güvenlik</h1>
                    <p className="text-slate-500">Kaçak satış tespiti için şüpheli kelime yönetimi</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
                    <span className="p-2 bg-red-50 text-red-600 rounded-lg">🎤</span>
                    Şüpheli Kelimeler Listesi
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="col-span-full bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300">
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={newWord}
                                onChange={(e) => setNewWord(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addWord()}
                                placeholder="Yeni şüpheli kelime veya cümle ekleyin..."
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                            <button
                                onClick={addWord}
                                disabled={isSaving}
                                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                {isSaving ? 'Kaydediliyor...' : 'Ekle'}
                            </button>
                        </div>
                        <p className="mt-3 text-xs text-slate-400">
                            * Sistem bu kelimeleri gerçek zamanlı olarak dinler. Satış kaydı yoksa alarm üretir.
                        </p>
                    </div>

                    {words.map((word) => (
                        <div
                            key={word}
                            className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-red-200 group transition-all"
                        >
                            <span className="font-medium text-slate-700">{word}</span>
                            <button
                                onClick={() => removeWord(word)}
                                className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                            </button>
                        </div>
                    ))}

                    {words.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-400">
                            Henüz şüpheli kelime eklenmemiş.
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-amber-50 rounded-3xl p-8 border border-amber-100">
                <h3 className="text-amber-800 font-bold mb-2 flex items-center gap-2">
                    <span>💡</span> Kaçak Satış Tespiti Nasıl Çalışır?
                </h3>
                <ul className="text-amber-700 text-sm space-y-2 list-disc ml-5">
                    <li>Sistem sadece <b>Chrome veya Edge</b> tarayıcılarında çalışır.</li>
                    <li>Mikrofon izni gereklidir ve admin panelindeki yüzen mikrofon ikonuna basılarak başlatılır.</li>
                    <li>Eğer personel yukarıdaki kelimelerden birini söylerse ve <b>son 5 dakikada</b> gerçekleşmiş bir satış bulamazsa &quot;Şüpheli İşlem&quot; alarmı tetiklenir.</li>
                    <li>Alarmlar hem bildirim olarak düşer hem de &quot;Güvenlik &gt; Şüpheli Olaylar&quot; sayfasında saklanır.</li>
                </ul>
            </div>
        </div>
    );
}
