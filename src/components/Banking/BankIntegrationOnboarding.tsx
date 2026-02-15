"use client";

import React, { useState } from 'react';
import { BANK_FORM_DEFINITIONS, BankDefinition } from '@/services/banking/bank-definitions';
import { useModal } from '@/contexts/ModalContext';
import { jsPDF } from 'jspdf';
import { BankConnectionStatus } from '@/services/banking/bank-connection-service';
import { apiFetch } from '@/lib/api-client';

export default function BankOnboardingHub() {
    const { showSuccess, showError } = useModal();
    const [activeSubTab, setActiveSubTab] = useState<'apply' | 'connect'>('apply');
    const [selectedBankId, setSelectedBankId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [credentials, setCredentials] = useState<Record<string, string>>({});
    const [isTesting, setIsTesting] = useState(false);
    const [testResults, setTestResults] = useState<{
        connectivity: { status: 'PASS' | 'FAIL', latencyMs: number, message: string, errorCode: string | null },
        permission: { status: 'PASS' | 'FAIL', message: string, errorCode: string | null }
    } | null>(null);
    const [currentStepStatus, setCurrentStepStatus] = useState<string>('DRAFT');

    const selectedBank = selectedBankId ? BANK_FORM_DEFINITIONS[selectedBankId] : null;

    const isFormValid = () => {
        if (!selectedBank) return false;
        return selectedBank.requiredCredentials.every(key => credentials[key] && credentials[key].trim() !== '');
    };

    const handleDownloadForm = () => {
        if (!selectedBank) return;

        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.text("BANKA ENTEGRASYON BAŞVURU FORMU", 105, 20, { align: "center" });

        doc.setFontSize(14);
        doc.text(`Banka: ${selectedBank.displayName}`, 20, 40);
        doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, 50);

        doc.setFontSize(12);
        doc.text("Aşağıdaki alanların banka tarafından tanımlanması ve taraflara iletilmesi rica olunur.", 20, 70);

        let y = 85;
        selectedBank.onboardingFields.forEach((field) => {
            const isRequired = selectedBank.requiredCredentials.includes(field.key);
            let statusText = isRequired ? "[ZORUNLU]" : "[OPSİYONEL - VARSA]";

            // Special rule for Kuveyt Turk
            if (selectedBank.id === 'KUVEYT_TURK' && (field.key === 'serviceUsername' || field.key === 'servicePassword')) {
                statusText = "[OPSİYONEL - VARSA DOLDURUNUZ]";
            }

            doc.text(`${field.label}: ____________________ ${statusText}`, 20, y);
            y += 10;
        });

        y += 10;
        doc.setFontSize(10);
        doc.text("Teknik Notlar:", 20, y);
        y += 5;
        selectedBank.technicalAppendix.protocolNotes.forEach(note => {
            doc.text(`- ${note}`, 25, y);
            y += 5;
        });

        doc.save(`${selectedBank.id}_Basvuru_Formu.pdf`);
        showSuccess('Başarılı', `${selectedBank.displayName} için başvuru dokümanları (PDF) indirildi.`);
        setCurrentStepStatus('PENDING_ACTIVATION');
    };

    const handleTestConnection = async () => {
        if (!selectedBank) return;
        setIsTesting(true);
        setTestResults(null);
        try {
            const res = await apiFetch('/api/fintech/banking/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bankId: selectedBankId,
                    credentials
                })
            });
            const data = await res.json();
            if (data.success) {
                setTestResults({
                    connectivity: data.connectivity,
                    permission: data.permission
                });

                if (data.connectivity.status === 'PASS' && data.permission.status === 'PASS') {
                    showSuccess('Bağlantı Başarılı', 'Banka API erişimi ve yetkilendirme doğrulandı.');
                } else {
                    showError('Doğrulama Sorunu', data.permission.message || data.connectivity.message);
                }

                if (data.recommendedStatus) {
                    setCurrentStepStatus(data.recommendedStatus);
                }
            } else {
                showError('Hata', data.error || 'Test yapılamadı.');
            }
        } catch (err) {
            showError('Hata', 'Test sırasında bir iletişim hatası oluştu.');
        } finally {
            setIsTesting(false);
        }
    };

    const handleSaveCredentials = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBank) return;

        setIsSaving(true);
        try {
            const res = await apiFetch('/api/fintech/banking/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bankId: selectedBankId,
                    integrationMethod: selectedBank.integrationMethod,
                    credentials,
                    status: currentStepStatus
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
                                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">
                                                    {field.label} {selectedBank.requiredCredentials.includes(field.key) && <span className="text-rose-500">*</span>}
                                                </label>
                                                {field.type === 'select' ? (
                                                    <select
                                                        required={selectedBank.requiredCredentials.includes(field.key)}
                                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none"
                                                        value={credentials[field.key] || field.default || ''}
                                                        onChange={e => {
                                                            setCredentials({ ...credentials, [field.key]: e.target.value });
                                                            setTestResults(null);
                                                        }}
                                                    >
                                                        <option value="">Seçiniz</option>
                                                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type={field.type}
                                                        required={selectedBank.requiredCredentials.includes(field.key)}
                                                        placeholder={field.placeholder}
                                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono"
                                                        value={credentials[field.key] || ''}
                                                        onChange={e => {
                                                            setCredentials({ ...credentials, [field.key]: e.target.value });
                                                            setTestResults(null);
                                                        }}
                                                    />
                                                )}
                                                {field.helperText && <p className="text-[10px] text-white/40 italic pl-1">{field.helperText}</p>}
                                            </div>
                                        ))}
                                    </div>

                                    {testResults && (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className={`p-4 rounded-xl border flex items-center justify-between ${testResults.connectivity.status === 'PASS' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg">{testResults.connectivity.status === 'PASS' ? '✅' : '❌'}</span>
                                                        <div>
                                                            <p className="text-[10px] font-black text-white/40 uppercase">Erişim (Connectivity)</p>
                                                            <p className={`text-xs font-bold ${testResults.connectivity.status === 'PASS' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                {testResults.connectivity.status === 'PASS' ? `Aktif (${testResults.connectivity.latencyMs}ms)` : 'Erişim Yok'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`p-4 rounded-xl border flex items-center justify-between ${testResults.permission.status === 'PASS' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg">{testResults.permission.status === 'PASS' ? '✅' : '❌'}</span>
                                                        <div>
                                                            <p className="text-[10px] font-black text-white/40 uppercase">Yetki (Permission)</p>
                                                            <p className={`text-xs font-bold ${testResults.permission.status === 'PASS' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                {testResults.permission.status === 'PASS' ? 'Doğrulandı' : 'Hatalı'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {(testResults.connectivity.status === 'FAIL' || testResults.permission.status === 'FAIL') && (
                                                <div className="p-4 bg-white/5 border-l-4 border-l-amber-500 rounded-xl space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-amber-500">🛡️</span>
                                                        <h5 className="text-xs font-black text-white uppercase">Ne yapmalıyım?</h5>
                                                    </div>
                                                    <p className="text-xs text-white/60 font-medium">
                                                        {testResults.connectivity.errorCode === 'IP_NOT_WHITELISTED' && "Bankaya Periodya IP'lerini whitelist ettirmeniz gerekmektedir. Teknik dokümandaki IP listesini banka temsilcinize iletin."}
                                                        {testResults.permission.errorCode === 'AUTH_FAILED' && "Kullanıcı adı veya şifre banka sisteminde geçersiz. Lütfen bilgileri kontrol edip tekrar deneyin."}
                                                        {testResults.connectivity.errorCode === 'TIMEOUT' && "Banka servisi yanıt vermiyor. Lütfen kısa süre sonra tekrar deneyin veya banka servis durumunu kontrol edin."}
                                                        {(!testResults.connectivity.errorCode && testResults.permission.status === 'FAIL') && "Bağlantı sağlandı ancak yetki testi başarısız oldu. Lütfen servis kullanım izinlerinizin aktif olduğundan emin olun."}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={handleTestConnection}
                                            disabled={isTesting || !isFormValid()}
                                            className={`flex-1 h-14 rounded-xl font-black text-sm tracking-widest transition-all flex items-center justify-center gap-2 ${isTesting || !isFormValid() ? 'bg-white/5 text-white/20' : testResults?.permission.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                        >
                                            {isTesting ? '🌐 PING...' : testResults?.permission.status === 'PASS' ? '✅ TEST BAŞARILI' : testResults?.permission.status === 'FAIL' ? '❌ TEST BAŞARISIZ' : '🧪 BAĞLANTIYI TEST ET'}
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={isSaving || !isFormValid() || testResults?.permission.status !== 'PASS'}
                                            className={`flex-1 h-14 rounded-xl font-black text-sm tracking-widest transition-all ${isSaving || !isFormValid() || testResults?.permission.status !== 'PASS' ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-primary text-white shadow-xl shadow-primary/20'}`}
                                        >
                                            {isSaving ? 'KAYDEDİLİYOR...' : '🚀 AKTİF ET & KAYDET'}
                                        </button>
                                    </div>

                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${currentStepStatus === 'ACTIVE' ? 'bg-emerald-500 shadow-emerald-500/60' : currentStepStatus === 'PENDING_ACTIVATION' ? 'bg-amber-500 shadow-amber-500/60' : 'bg-blue-500 shadow-blue-500/60'}`}></div>
                                            <span className="text-[10px] font-black text-white/60 uppercase">Mevcut Durum:</span>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[10px] font-black ${currentStepStatus === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : currentStepStatus === 'PENDING_ACTIVATION' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-500/20 text-slate-400'}`}>
                                            {currentStepStatus.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
