"use client";

import React, { useState } from 'react';
import { BANK_FORM_DEFINITIONS } from '@/services/banking/bank-definitions';
import { useModal } from '@/contexts/ModalContext';
import { jsPDF } from 'jspdf';
import { apiFetch } from '@/lib/api-client';
import {
    EnterpriseCard,
    EnterpriseButton,
    EnterpriseField,
} from "@/components/ui/enterprise";

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ active, done, step, label }: { active: boolean; done: boolean; step: number; label: string }) {
    return (
        <div className={`flex items-center gap-2.5 ${active ? '' : 'opacity-40'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 transition-all ${done
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : active
                    ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400'
                }`}>
                {done ? '✓' : step}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${active ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{label}</span>
        </div>
    );
}

function StepConnector({ done }: { done: boolean }) {
    return (
        <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors ${done ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
    PENDING_ACTIVATION: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
    DRAFT: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
};

function ConnectionStatusBadge({ status }: { status: string }) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${STATUS_STYLES[status] || STATUS_STYLES.DRAFT}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-500' : status === 'PENDING_ACTIVATION' ? 'bg-amber-500' : 'bg-slate-400'}`} />
            {status.replace(/_/g, ' ')}
        </span>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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
                body: JSON.stringify({ bankId: selectedBankId, credentials })
            });
            const data = await res.json();
            if (data.success) {
                setTestResults({ connectivity: data.connectivity, permission: data.permission });
                if (data.connectivity.status === 'PASS' && data.permission.status === 'PASS') {
                    showSuccess('Bağlantı Başarılı', 'Banka API erişimi ve yetkilendirme doğrulandı.');
                } else {
                    showError('Doğrulama Sorunu', data.permission.message || data.connectivity.message);
                }
                if (data.recommendedStatus) setCurrentStepStatus(data.recommendedStatus);
            } else {
                showError('Hata', data.error || 'Test yapılamadı.');
            }
        } catch {
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
                body: JSON.stringify({ bankId: selectedBankId, integrationMethod: selectedBank.integrationMethod, credentials, status: currentStepStatus })
            });
            const data = await res.json();
            if (data.success) {
                showSuccess('Başarılı', 'Bağlantı bilgileri şifrelenerek kaydedildi.');
            } else {
                showError('Hata', data.error || 'Kaydedilemedi');
            }
        } catch {
            showError('Hata', 'Sunucu bağlantı hatası.');
        } finally {
            setIsSaving(false);
        }
    };

    const bankList = Object.values(BANK_FORM_DEFINITIONS);

    return (
        <div className="space-y-5">
            {/* Page Header */}
            <EnterpriseCard>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-2xl shrink-0">🏦</div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Banka Entegrasyon Merkezi</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">XML / MT940 / SFTP protokolleriyle banka bağlantısı kurun</p>
                        </div>
                    </div>
                    {selectedBank && <ConnectionStatusBadge status={currentStepStatus} />}
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-1">
                    <StepIndicator
                        step={1}
                        label="Banka Seç"
                        active={true}
                        done={!!selectedBankId}
                    />
                    <StepConnector done={!!selectedBankId} />
                    <StepIndicator
                        step={2}
                        label="Başvuru Yap"
                        active={!!selectedBankId}
                        done={currentStepStatus === 'PENDING_ACTIVATION' || currentStepStatus === 'ACTIVE'}
                    />
                    <StepConnector done={currentStepStatus === 'PENDING_ACTIVATION' || currentStepStatus === 'ACTIVE'} />
                    <StepIndicator
                        step={3}
                        label="Bağlantı Tanımla"
                        active={currentStepStatus === 'PENDING_ACTIVATION' || currentStepStatus === 'ACTIVE'}
                        done={currentStepStatus === 'ACTIVE'}
                    />
                    <StepConnector done={currentStepStatus === 'ACTIVE'} />
                    <StepIndicator
                        step={4}
                        label="Aktif"
                        active={currentStepStatus === 'ACTIVE'}
                        done={currentStepStatus === 'ACTIVE'}
                    />
                </div>
            </EnterpriseCard>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                {/* Bank List */}
                <EnterpriseCard className="lg:col-span-1 !p-0">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Banka Seçin</h3>
                    </div>
                    <div className="p-2 max-h-[480px] overflow-y-auto">
                        {bankList.map(bank => (
                            <button
                                key={bank.id}
                                onClick={() => {
                                    setSelectedBankId(bank.id);
                                    setCredentials({});
                                    setTestResults(null);
                                    setCurrentStepStatus('DRAFT');
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between group mb-1 ${selectedBankId === bank.id
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <span>{bank.displayName}</span>
                                {selectedBankId === bank.id && <span className="text-xs">✓</span>}
                            </button>
                        ))}
                    </div>
                </EnterpriseCard>

                {/* Action Area */}
                <div className="lg:col-span-3">
                    {!selectedBank ? (
                        <EnterpriseCard className="h-full flex flex-col items-center justify-center py-20 text-center">
                            <div className="text-5xl mb-4 opacity-20">🏦</div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Banka Seçin</h4>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                                Sol listeden entegre etmek istediğiniz bankayı seçerek devam edebilirsiniz.
                            </p>
                        </EnterpriseCard>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">
                            {/* Sub-tab Switcher */}
                            <div className="flex gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
                                {[
                                    { id: 'apply' as const, label: '📄 Başvuru & Doküman', step: '1' },
                                    { id: 'connect' as const, label: '🔑 Bağlantı Tanımla', step: '2' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveSubTab(tab.id)}
                                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeSubTab === tab.id
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Apply Tab */}
                            {activeSubTab === 'apply' && (
                                <EnterpriseCard>
                                    <div className="flex items-center gap-3.5 pb-5 mb-5 border-b border-slate-200 dark:border-slate-800">
                                        <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl shrink-0">📄</div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-white">{selectedBank.displayName} — Başvuru Süreci</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Gerekli dokümanları hazırlayın ve şubenize iletin.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                                            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Entegrasyon Yöntemi</div>
                                            <div className="font-semibold text-slate-900 dark:text-white text-sm">{selectedBank.integrationMethod}</div>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                                            <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">IP Whitelist</div>
                                            <div className="font-semibold text-slate-900 dark:text-white text-sm">
                                                {selectedBank.requiredNetwork === 'STATIC_IP' ? '✅ Gerekli' : '❌ Gerekli Değil'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-5">
                                        <div>
                                            <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Gerekli Belgeler</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedBank.requiredDocs.map(doc => (
                                                    <span key={doc} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                                        {doc.replace(/_/g, ' ')}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl">
                                            <h5 className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-2">Banka IT Notu</h5>
                                            <ul className="space-y-1">
                                                {selectedBank.technicalAppendix.protocolNotes.map((note, i) => (
                                                    <li key={i} className="text-xs text-blue-600 dark:text-blue-300/70 flex items-start gap-2">
                                                        <span className="shrink-0 mt-0.5">•</span>
                                                        <span>{note}</span>
                                                    </li>
                                                ))}
                                                <li className="text-xs text-blue-600 dark:text-blue-300/70 flex items-start gap-2">
                                                    <span className="shrink-0 mt-0.5">•</span>
                                                    <span>Erişim IP Listesi: {selectedBank.technicalAppendix.ipWhitelist.join(', ')}</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    <EnterpriseButton variant="primary" onClick={handleDownloadForm} className="w-full h-11">
                                        📥 Başvuru Paketini İndir (PDF)
                                    </EnterpriseButton>
                                </EnterpriseCard>
                            )}

                            {/* Connect Tab */}
                            {activeSubTab === 'connect' && (
                                <form onSubmit={handleSaveCredentials} className="space-y-4">
                                    <EnterpriseCard>
                                        <div className="flex items-center gap-3.5 pb-5 mb-5 border-b border-slate-200 dark:border-slate-800">
                                            <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl shrink-0">🔑</div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900 dark:text-white">{selectedBank.displayName} — Bağlantı Tanımla</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Bankadan gelen servis kullanıcı bilgilerini giriniz.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {selectedBank.onboardingFields.map(field => (
                                                <EnterpriseField
                                                    key={field.key}
                                                    label={`${field.label}${selectedBank.requiredCredentials.includes(field.key) ? ' *' : ''}`}
                                                    hint={field.helperText}
                                                >
                                                    {field.type === 'select' ? (
                                                        <select
                                                            required={selectedBank.requiredCredentials.includes(field.key)}
                                                            className="w-full h-10 px-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 dark:focus:border-slate-600 transition-all outline-none"
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
                                                            className="w-full h-10 px-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 dark:focus:border-slate-600 transition-all outline-none font-mono placeholder:font-sans placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                                            value={credentials[field.key] || ''}
                                                            onChange={e => {
                                                                setCredentials({ ...credentials, [field.key]: e.target.value });
                                                                setTestResults(null);
                                                            }}
                                                        />
                                                    )}
                                                </EnterpriseField>
                                            ))}
                                        </div>
                                    </EnterpriseCard>

                                    {/* Test Results */}
                                    {testResults && (
                                        <EnterpriseCard>
                                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Test Sonuçları</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                                <div className={`p-4 rounded-xl border flex items-center gap-3 ${testResults.connectivity.status === 'PASS'
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                                                    : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
                                                    }`}>
                                                    <span className="text-xl">{testResults.connectivity.status === 'PASS' ? '✅' : '❌'}</span>
                                                    <div>
                                                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Erişim (Connectivity)</p>
                                                        <p className={`text-sm font-medium ${testResults.connectivity.status === 'PASS' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                                            {testResults.connectivity.status === 'PASS' ? `Aktif (${testResults.connectivity.latencyMs}ms)` : 'Erişim Yok'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className={`p-4 rounded-xl border flex items-center gap-3 ${testResults.permission.status === 'PASS'
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                                                    : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
                                                    }`}>
                                                    <span className="text-xl">{testResults.permission.status === 'PASS' ? '✅' : '❌'}</span>
                                                    <div>
                                                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Yetki (Permission)</p>
                                                        <p className={`text-sm font-medium ${testResults.permission.status === 'PASS' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                                            {testResults.permission.status === 'PASS' ? 'Doğrulandı' : 'Hatalı'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {(testResults.connectivity.status === 'FAIL' || testResults.permission.status === 'FAIL') && (
                                                <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border-l-4 border-l-amber-500 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span>🛡️</span>
                                                        <h5 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase">Ne yapmalıyım?</h5>
                                                    </div>
                                                    <p className="text-xs text-amber-600 dark:text-amber-400/70">
                                                        {testResults.connectivity.errorCode === 'IP_NOT_WHITELISTED' && "Bankaya Periodya IP'lerini whitelist ettirmeniz gerekmektedir. Teknik dokümandaki IP listesini banka temsilcinize iletin."}
                                                        {testResults.permission.errorCode === 'AUTH_FAILED' && "Kullanıcı adı veya şifre banka sisteminde geçersiz. Lütfen bilgileri kontrol edip tekrar deneyin."}
                                                        {testResults.connectivity.errorCode === 'TIMEOUT' && "Banka servisi yanıt vermiyor. Lütfen kısa süre sonra tekrar deneyin veya banka servis durumunu kontrol edin."}
                                                        {(!testResults.connectivity.errorCode && testResults.permission.status === 'FAIL') && "Bağlantı sağlandı ancak yetki testi başarısız oldu. Lütfen servis kullanım izinlerinizin aktif olduğundan emin olun."}
                                                    </p>
                                                </div>
                                            )}
                                        </EnterpriseCard>
                                    )}

                                    {/* Action Buttons */}
                                    <EnterpriseCard>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <EnterpriseButton
                                                type="button"
                                                variant="secondary"
                                                onClick={handleTestConnection}
                                                disabled={isTesting || !isFormValid()}
                                                className={`flex-1 h-11 ${testResults?.permission.status === 'PASS' ? '!border-emerald-300 dark:!border-emerald-500/30 !text-emerald-600 dark:!text-emerald-400 !bg-emerald-50 dark:!bg-emerald-500/10' : ''}`}
                                            >
                                                {isTesting
                                                    ? <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Bağlantı Test Ediliyor...</>
                                                    : testResults?.permission.status === 'PASS'
                                                        ? '✅ Test Başarılı'
                                                        : testResults?.permission.status === 'FAIL'
                                                            ? '❌ Tekrar Test Et'
                                                            : '🧪 Bağlantıyı Test Et'
                                                }
                                            </EnterpriseButton>

                                            <EnterpriseButton
                                                type="submit"
                                                variant="primary"
                                                disabled={isSaving || !isFormValid() || testResults?.permission.status !== 'PASS'}
                                                className="flex-1 h-11"
                                            >
                                                {isSaving
                                                    ? <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Kaydediliyor...</>
                                                    : <>🚀 Aktif Et & Kaydet</>
                                                }
                                            </EnterpriseButton>
                                        </div>

                                        {/* Status Row */}
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bağlantı Durumu</span>
                                            <ConnectionStatusBadge status={currentStepStatus} />
                                        </div>
                                    </EnterpriseCard>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
