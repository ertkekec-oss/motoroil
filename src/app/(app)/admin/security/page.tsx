"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ShieldAlert, Mic, Plus, Trash2, Info, AlertTriangle, Loader2 } from 'lucide-react';

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

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-32 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
            <span className="text-sm font-bold tracking-widest uppercase">Güvenlik Motoru Yükleniyor...</span>
        </div>
    );

    return (
        <div className="bg-slate-50 dark:bg-[#0f172a] min-h-screen w-full font-sans pb-16">
            <div className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300 space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                            <ShieldAlert className="w-7 h-7 text-indigo-600 dark:text-indigo-500" />
                            Operasyonel Güvenlik
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            Kaçak satış ve anomali tespiti için akustik dinleme ve şüpheli kelime motoru yönetimi.
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-[#111827]/50">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase tracking-widest">
                            <Mic className="w-4 h-4 text-rose-500" />
                            Akustik Tehdit İmzaları (Şüpheli Kelimeler)
                        </h2>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Add Input Area */}
                        <div className="bg-slate-50 dark:bg-[#0f172a] p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <AlertTriangle className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={newWord}
                                        onChange={(e) => setNewWord(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addWord()}
                                        placeholder="Yeni şüpheli kelime veya gramer ekleyin..."
                                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-900 dark:text-white dark:placeholder-slate-500 transition-all font-medium"
                                    />
                                </div>
                                <button
                                    onClick={addWord}
                                    disabled={isSaving || !newWord.trim()}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-bold rounded-xl transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm whitespace-nowrap"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    İmza Ekle
                                </button>
                            </div>
                            <p className="mt-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5" />
                                Sistem bu kelimeleri gerçek zamanlı olarak dinler. Satış kaydı yoksa alarm üretir.
                            </p>
                        </div>

                        {/* Words Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {words?.map((word) => (
                                <div
                                    key={word}
                                    className="flex justify-between items-center p-3.5 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-sm hover:border-rose-300 dark:hover:border-rose-500/50 group transition-all"
                                >
                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300 truncate font-mono" title={word}>{word}</span>
                                    <button
                                        onClick={() => removeWord(word)}
                                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 outline-none"
                                        title="Kaldır"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {words.length === 0 && (
                                <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                                    <Mic className="w-8 h-8 mb-3 opacity-20" />
                                    <span className="font-bold tracking-widest uppercase text-[11px]">Akustik İmza Bulunamadı</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50/50 dark:bg-amber-500/5 rounded-2xl p-6 border border-amber-200/50 dark:border-amber-500/20">
                    <h3 className="text-amber-800 dark:text-amber-400 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-widest">
                        <Info className="w-4 h-4" /> Kaçak Satış Tespiti Nasıl Çalışır?
                    </h3>
                    <ul className="text-amber-700/80 dark:text-amber-300/80 text-xs font-medium space-y-2.5 list-disc ml-5 marker:text-amber-400/50">
                        <li>Sistem akustiği işleyebilmek için sadece <b>Chrome veya Edge (Blink tabanlı)</b> tarayıcılarında çalışır.</li>
                        <li>Platform admin panelindeki yüzen mikrofon ikonuna basılarak başlatılır ve aktif dinleme modu devreye girer.</li>
                        <li>Eğer personel yukarıdaki imzalardan birini sesli telaffuz ederse ve <b>son 5 dakikada (300 saniye)</b> POS/Fatura üzerinde gerçekleşmiş bir satış kaydı bulamazsa <b>"Şüpheli İşlem / Kaçak Alarmı"</b> tetiklenir.</li>
                        <li>Alarmlar anlık bildirim olarak (Push) düşer ve "Güvenlik &gt; Şüpheli Olaylar" denetim günlüğünde immutable olarak saklanır.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
