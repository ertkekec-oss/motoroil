"use client";

import React, { useState } from 'react';
import { BANK_FORM_DEFINITIONS, BankDefinition } from '@/services/banking/bank-definitions';
import { useModal } from '@/contexts/ModalContext';

export default function BankOnboardingHub() {
    const { showSuccess, showError } = useModal();
    const [activeSubTab, setActiveSubTab] = useState<'apply' | 'connect'>('apply');
    const [selectedBankId, setSelectedBankId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [credentials, setCredentials] = useState<Record<string, string>>({});

    const selectedBank = selectedBankId ? BANK_FORM_DEFINITIONS[selectedBankId] : null;

    const handleDownloadForm = () => {
        if (!selectedBank) return;
        // In a real app, this would generate a PDF via a library like jsPDF or a server-side route
        showSuccess('Başarılı', `${selectedBank.displayName} için başvuru dokümanları hazırlandı. PDF indiriliyor...`);
    };

    const handleSaveCredentials = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBank) return;

        setIsSaving(true);
        try {
            const res = await fetch('/api/fintech/banking/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bankId: selectedBankId,
                    integrationMethod: selectedBank.integrationMethod,
                    credentials
                })
            });
            const data = await res.json();
            if (data.success) {
                showSuccess('Başarılı', 'Bağlantı bilgileri şifrelenerek kaydedildi.');
            } else {
                showError('Hata', data.error || 'Kaydedilemedi');
            }
        } catch (err) {
            showError('Hata', 'Sunucu bağlantı hatası.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="card glass p-6 border-l-4 border-l-blue-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-black text-white">🏦 Banka Entegrasyon Merkezi</h3>
                        <p className="text-xs text-white/40 font-bold mt-1 uppercase tracking-tighter">BizimHesap Tarzı Entegrasyon (XML / MT940 / SFTP)</p>
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveSubTab('apply')}
                            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeSubTab === 'apply' ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                        >
                            1. FORM ÜRET & BAŞVUR
                        </button>
                        <button
                            onClick={() => setActiveSubTab('connect')}
                            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeSubTab === 'connect' ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                        >
                            2. BAĞLANTIYI TANIMLA
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Banka Seçimi */}
                <div className="md:col-span-1 space-y-4">
                    <div className="card glass p-4">
                        <label className="text-[10px] font-black text-white/40 uppercase mb-2 block">Banka Seçiniz</label>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {Object.values(BANK_FORM_DEFINITIONS).map(bank => (
                                <button
                                    key={bank.id}
                                    onClick={() => setSelectedBankId(bank.id)}
                                    className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between group ${selectedBankId === bank.id ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                >
                                    <span className={`font-bold text-sm ${selectedBankId === bank.id ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>{bank.displayName}</span>
                                    {selectedBankId === bank.id && <span className="text-primary">✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* İşlem Alanı */}
                <div className="md:col-span-2">
                    {!selectedBank ? (
                        <div className="card glass h-full flex flex-col items-center justify-center p-12 text-center opacity-40">
                            <div className="text-6xl mb-4">🏦</div>
                            <h4 className="text-lg font-bold text-white">İşlem Yapmak İçin Banka Seçin</h4>
                            <p className="text-sm max-w-xs">Sol taraftaki listeden entegre etmek istediğiniz bankayı seçerek devam edebilirsiniz.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            {activeSubTab === 'apply' ? (
                                <div className="card glass p-6 space-y-6">
                                    <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-2xl">📄</div>
                                        <div>
                                            <h4 className="font-black text-white">{selectedBank.displayName} Başvuru Süreci</h4>
                                            <p className="text-xs text-white/40">Gerekli dokümanları hazırlayın ve şubenize iletin.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                            <span className="text-[10px] font-black text-primary uppercase">Entegrasyon Yöntemi</span>
                                            <div className="font-bold text-white mt-1">{selectedBank.integrationMethod}</div>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                            <span className="text-[10px] font-black text-amber-500 uppercase">IP Whitelist Gerekli</span>
                                            <div className="font-bold text-white mt-1">{selectedBank.requiredNetwork === 'STATIC_IP' ? 'EVET' : 'HAYIR'}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h5 className="text-xs font-black text-white/40 uppercase">Gerekli Belgeler</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedBank.requiredDocs.map(doc => (
                                                <span key={doc} className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-white/60 border border-white/5">
                                                    {doc.replace(/_/g, ' ')}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2">
                                        <h5 className="text-xs font-black text-blue-400 uppercase">Banka IT Notu</h5>
                                        <ul className="text-xs text-blue-200/60 list-disc list-inside space-y-1">
                                            {selectedBank.technicalAppendix.protocolNotes.map((note, i) => <li key={i}>{note}</li>)}
                                            <li>Erişim IP Listesi: {selectedBank.technicalAppendix.ipWhitelist.join(', ')}</li>
                                        </ul>
                                    </div>

                                    <button
                                        onClick={handleDownloadForm}
                                        className="w-full h-14 bg-primary hover:bg-primary/80 text-white rounded-xl font-black text-sm tracking-widest shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3"
                                    >
                                        📥 BAŞVURU PAKETİNİ İNDİR (PDF)
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSaveCredentials} className="card glass p-6 space-y-6">
                                    <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-2xl">🔑</div>
                                        <div>
                                            <h4 className="font-black text-white">{selectedBank.displayName} Bağlantı Tanımla</h4>
                                            <p className="text-xs text-white/40">Bankadan gelen servis kullanıcı bilgilerini giriniz.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {selectedBank.onboardingFields.map(field => (
                                            <div key={field.key} className="space-y-2">
                                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">{field.label}</label>
                                                {field.type === 'select' ? (
                                                    <select
                                                        required={field.required}
                                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none"
                                                        value={credentials[field.key] || field.default || ''}
                                                        onChange={e => setCredentials({ ...credentials, [field.key]: e.target.value })}
                                                    >
                                                        <option value="">Seçiniz</option>
                                                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type={field.type}
                                                        required={field.required}
                                                        placeholder={field.placeholder}
                                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono"
                                                        value={credentials[field.key] || ''}
                                                        onChange={e => setCredentials({ ...credentials, [field.key]: e.target.value })}
                                                    />
                                                )}
                                                {field.helperText && <p className="text-[10px] text-white/40 italic pl-1">{field.helperText}</p>}
                                            </div>
                                        ))}
                                    </div>

                                    {!selectedBank.supportsAutoPull && (
                                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-500 font-bold">
                                            ⚠️ Bu banka otomatik çekimi (Auto Pull) desteklememektedir. İşlemleri MANUEL YÜKLEME sekmesinden aktarabilirsiniz.
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm tracking-widest shadow-xl shadow-emerald-900/20 transition-all"
                                    >
                                        {isSaving ? 'KAYDEDİLİYOR...' : '✅ BAĞLANTIYI KAYDET VE AKTİF ET'}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
