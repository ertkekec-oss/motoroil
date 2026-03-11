'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useModal } from '@/contexts/ModalContext';
import { ShieldAlert, FileText, CheckCircle, Clock } from 'lucide-react';

interface GatekeeperProps {
    moduleId: string;
    children: React.ReactNode;
}

export default function ModuleGatekeeper({ moduleId, children }: GatekeeperProps) {
    const { showSuccess, showError } = useModal();
    const [loading, setLoading] = useState(true);
    const [statusData, setStatusData] = useState<any>(null);

    const checkStatus = async () => {
        try {
            const res = await apiFetch(`/api/kyc/status?moduleId=${moduleId}`);
            const data = await res.json();
            if (data.success) {
                setStatusData(data);
            }
        } catch (error) {
            console.error('Failed to load module verification', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();
    }, [moduleId]);

    const handleFileUpload = async (reqId: string, file: File) => {
        try {
            const formData = new FormData();
            formData.append('requirementId', reqId);
            formData.append('file', file);

            const res = await apiFetch('/api/kyc/submit', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                showSuccess('Başarılı', 'Belge yüklendi ve incelemeye alındı.');
                checkStatus();
            } else throw new Error(data.error);
        } catch (e: any) {
            showError('Yükleme Hatası', e.message);
        }
    };

    const handleSign = async (contractId: string, version: number) => {
        try {
            const res = await apiFetch('/api/kyc/sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contractId, version })
            });

            const data = await res.json();
            if (data.success) {
                showSuccess('İmzalandı', 'Sözleşme onayı kaydedildi.');
                checkStatus();
            } else throw new Error(data.error);
        } catch (e: any) {
            showError('Hata', e.message);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-500">
                <ShieldAlert className="w-10 h-10 mb-4 animate-pulse opacity-50" />
                <p>Erişim gereksinimleri denetleniyor...</p>
            </div>
        );
    }

    if (statusData && statusData.isModuleActive) {
        return <>{children}</>;
    }

    return (
        <div className="max-w-4xl mx-auto w-full px-8 py-10 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Kurumsal İşlem Onayı Gerekiyor</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-lg mb-10 text-[15px] leading-relaxed">
                    Bu modülü kullanmaya başlamak için yasal / operasyonel zorunlulukları tamamlamanız gerekmektedir. Tüm belgeler güvenli altyapımızda (KYC) uçtan uca özel kilitli tutulur.
                </p>

                <div className="w-full space-y-4 text-left">
                    {statusData?.requirements?.map((reqItem: any, i: number) => {
                        const { requirement, status, isFulfilled } = reqItem;

                        return (
                            <div key={requirement.id} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-sm transition">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col pt-1">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isFulfilled ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                                            {isFulfilled ? <CheckCircle className="w-4 h-4" /> : i + 1}
                                        </div>
                                        {i !== statusData.requirements.length - 1 && <div className="w-0.5 h-12 bg-slate-200 dark:bg-slate-800 mx-auto my-1" />}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white text-[15px]">{requirement.name}</h4>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{requirement.description}</p>
                                        
                                        {!isFulfilled && status === 'MISSING' && (
                                            <span className="inline-block px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold mt-3">Eksik (İşlem Bekliyor)</span>
                                        )}
                                        {!isFulfilled && status === 'PENDING' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold mt-3"><Clock className="w-3.5 h-3.5" /> İncelemede (Onay Bekleniyor)</span>
                                        )}
                                        {!isFulfilled && status === 'REJECTED' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold mt-3"><ShieldAlert className="w-3.5 h-3.5" /> Reddedildi - Telafi Gerekli</span>
                                        )}
                                    </div>
                                </div>

                                <div className="shrink-0 flex items-center justify-end">
                                    {isFulfilled ? (
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-xl flex items-center gap-2">
                                            ✅ Tamamlandı
                                        </span>
                                    ) : (
                                        requirement.type === 'DOCUMENT' ? (
                                            <label className="cursor-pointer bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md">
                                                Dosya Yükle
                                                <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => {
                                                    if (e.target.files?.[0]) handleFileUpload(requirement.id, e.target.files[0]);
                                                }} />
                                            </label>
                                        ) : (
                                            <ContractInteractiveView 
                                                contract={requirement.contract} 
                                                onSign={() => handleSign(requirement.contract.id, requirement.contract.version)} 
                                            />
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function ContractInteractiveView({ contract, onSign }: { contract: any; onSign: () => void }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button onClick={() => setOpen(true)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md flex items-center gap-2">
                <FileText className="w-4 h-4" /> Sözleşmeyi İncele
            </button>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col h-[85vh] animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-200 dark:border-white/10 shrink-0">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{contract.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sürüm: {contract.version}</p>
                        </div>
                        <div className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-[#020617] text-slate-700 dark:text-slate-300 text-[14px] leading-relaxed" 
                             dangerouslySetInnerHTML={{ __html: contract.content }} />
                        <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shrink-0 flex items-center justify-between rounded-b-3xl">
                            <p className="text-xs text-slate-500 max-w-sm">"Onaylıyorum" diyerek ilgili sözleşmenin tüm maddelerini kabul ettiğinizi elektronik ortamda beyan etmiş olursunuz.</p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setOpen(false)} className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white">Daha Sonra</button>
                                <button onClick={() => { setOpen(false); onSign(); }} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20">
                                    Okudum ve Onaylıyorum
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
