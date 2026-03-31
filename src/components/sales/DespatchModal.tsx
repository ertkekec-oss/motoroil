"use client";

import { EnterpriseCard, EnterpriseInput, EnterpriseButton } from "@/components/ui/enterprise";

interface DespatchModalProps {
    showDespatchModal: boolean;
    setShowDespatchModal: (show: boolean) => void;
    despatchForm: any;
    setDespatchForm: (form: any) => void;
    handleFinalSendDespatch: () => void;
    isSendingDespatch: boolean;
}

export function DespatchModal({
    showDespatchModal,
    setShowDespatchModal,
    despatchForm,
    setDespatchForm,
    handleFinalSendDespatch,
    isSendingDespatch
}: DespatchModalProps) {
    if (!showDespatchModal) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animation-fade-in">
            <EnterpriseCard className="w-full max-w-2xl bg-white dark:bg-[#0f172a] shadow-2xl overflow-hidden p-0 border border-slate-200 dark:border-white/10" noPadding>
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100 dark:border-white/5">
                        <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="text-3xl">🚚</span> e-İrsaliye Detayları
                        </h3>
                        <button
                            onClick={() => setShowDespatchModal(false)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 max-w-lg leading-relaxed">
                        Lütfen sevkiyat ve taşıma bilgilerini eksiksiz doldurunuz. Bu bilgiler resmî e-İrsaliye belgesi üzerinde yer alacaktır.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <EnterpriseInput
                            label="İRSALİYE SERİSİ"
                            hint="Boş bırakılırsa varsayılan seri kullanılır."
                            placeholder="Örn: IRS"
                            maxLength={3}
                            value={despatchForm.despatchSeries || ''}
                            onChange={e => setDespatchForm({ ...despatchForm, despatchSeries: e.target.value.toUpperCase() })}
                        />
                        <EnterpriseInput
                            label="ARAÇ PLAKA"
                            placeholder="34 ABC 123"
                            value={despatchForm.plateNumber || ''}
                            onChange={e => setDespatchForm({ ...despatchForm, plateNumber: e.target.value.toUpperCase() })}
                        />
                        <EnterpriseInput
                            label="DORSE PLAKA (OPSİYONEL)"
                            placeholder="DORSE NO"
                            value={despatchForm.trailerPlateNumber || ''}
                            onChange={e => setDespatchForm({ ...despatchForm, trailerPlateNumber: e.target.value.toUpperCase() })}
                        />
                        <EnterpriseInput
                            label="SÜRÜCÜ TCKN"
                            placeholder="11 haneli kimlik no"
                            maxLength={11}
                            value={despatchForm.driverId || ''}
                            onChange={e => setDespatchForm({ ...despatchForm, driverId: e.target.value })}
                        />
                        <EnterpriseInput
                            label="SÜRÜCÜ ADI"
                            placeholder="Ad"
                            value={despatchForm.driverName || ''}
                            onChange={e => setDespatchForm({ ...despatchForm, driverName: e.target.value })}
                        />
                        <EnterpriseInput
                            label="SÜRÜCÜ SOYADI"
                            placeholder="Soyad"
                            value={despatchForm.driverSurname || ''}
                            onChange={e => setDespatchForm({ ...despatchForm, driverSurname: e.target.value })}
                        />
                        <EnterpriseInput
                            type="date"
                            label="FİİLİ SEVK TARİHİ"
                            value={despatchForm.shipmentDate || ''}
                            onChange={e => setDespatchForm({ ...despatchForm, shipmentDate: e.target.value })}
                        />
                        <EnterpriseInput
                            type="time"
                            label="FİİLİ SEVK SAATİ"
                            value={despatchForm.shipmentTime || ''}
                            onChange={e => setDespatchForm({ ...despatchForm, shipmentTime: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end mt-10 gap-4 pt-6 border-t border-slate-100 dark:border-white/5">
                        <EnterpriseButton
                            variant="secondary"
                            onClick={() => setShowDespatchModal(false)}
                        >
                            İptal
                        </EnterpriseButton>
                        <EnterpriseButton
                            onClick={handleFinalSendDespatch}
                            disabled={isSendingDespatch}
                            className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                        >
                            {isSendingDespatch ? 'GÖNDERİLİYOR...' : 'RESMİLEŞTİR VE GÖNDER'}
                        </EnterpriseButton>
                    </div>
                </div>
            </EnterpriseCard>
        </div>
    );
}
