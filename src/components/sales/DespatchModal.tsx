
"use client";

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
        <div className="modal-backdrop px-4">
            <div className="modal-content glass shadow-2xl" style={{ maxWidth: '600px', width: '100%', borderRadius: '24px', overflow: 'hidden' }}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 className="text-xl font-bold m-0 flex items-center gap-2">
                            <span style={{ fontSize: '1.5rem' }}>🚚</span> e-İrsaliye Detayları
                        </h3>
                        <button
                            onClick={() => setShowDespatchModal(false)}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>

                    <p className="text-white/60 mb-8 leading-relaxed" style={{ fontSize: '14px' }}>
                        Lütfen sevkiyat ve taşıma bilgilerini eksiksiz doldurunuz. Bu bilgiler resmî e-İrsaliye belgesi üzerinde yer alacaktır.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="form-group">
                            <label className="text-white/50 mb-2 block font-medium uppercase tracking-wider" style={{ fontSize: '11px' }}>İRSALİYE SERİSİ</label>
                            <input
                                type="text"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all placeholder:text-white/20"
                                placeholder="Örn: IRS"
                                maxLength={3}
                                value={despatchForm.despatchSeries || ''}
                                onChange={e => setDespatchForm({ ...despatchForm, despatchSeries: e.target.value.toUpperCase() })}
                            />
                            <p className="text-[10px] text-white/30 mt-1 italic leading-tight">Boş bırakılırsa entegrasyondaki varsayılan seri kullanılır.</p>
                        </div>
                        <div className="form-group">
                            <label className="text-white/50 mb-2 block font-medium uppercase tracking-wider" style={{ fontSize: '11px' }}>ARAÇ PLAKA</label>
                            <input
                                type="text"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all placeholder:text-white/20"
                                placeholder="34 ABC 123"
                                value={despatchForm.plateNumber}
                                onChange={e => setDespatchForm({ ...despatchForm, plateNumber: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="text-white/50 mb-2 block font-medium uppercase tracking-wider" style={{ fontSize: '11px' }}>DORSE PLAKA (OPSİYONEL)</label>
                            <input
                                type="text"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all placeholder:text-white/20"
                                placeholder="DORSE NO"
                                value={despatchForm.trailerPlateNumber || ''}
                                onChange={e => setDespatchForm({ ...despatchForm, trailerPlateNumber: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="text-white/50 mb-2 block font-medium uppercase tracking-wider" style={{ fontSize: '11px' }}>SÜRÜCÜ TCKN</label>
                            <input
                                type="text"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all placeholder:text-white/20"
                                placeholder="11 haneli kimlik no"
                                maxLength={11}
                                value={despatchForm.driverId}
                                onChange={e => setDespatchForm({ ...despatchForm, driverId: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="text-white/50 mb-2 block font-medium uppercase tracking-wider" style={{ fontSize: '11px' }}>SÜRÜCÜ ADI</label>
                            <input
                                type="text"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all placeholder:text-white/20"
                                placeholder="Ad"
                                value={despatchForm.driverName}
                                onChange={e => setDespatchForm({ ...despatchForm, driverName: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="text-white/50 mb-2 block font-medium uppercase tracking-wider" style={{ fontSize: '11px' }}>SÜRÜCÜ SOYADI</label>
                            <input
                                type="text"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all placeholder:text-white/20"
                                placeholder="Soyad"
                                value={despatchForm.driverSurname}
                                onChange={e => setDespatchForm({ ...despatchForm, driverSurname: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="text-white/50 mb-2 block font-medium uppercase tracking-wider" style={{ fontSize: '11px' }}>FİİLİ SEVK TARİHİ</label>
                            <input
                                type="date"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all"
                                value={despatchForm.shipmentDate}
                                onChange={e => setDespatchForm({ ...despatchForm, shipmentDate: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="text-white/50 mb-2 block font-medium uppercase tracking-wider" style={{ fontSize: '11px' }}>FİİLİ SEVK SAATİ</label>
                            <input
                                type="time"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all"
                                value={despatchForm.shipmentTime}
                                onChange={e => setDespatchForm({ ...despatchForm, shipmentTime: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end mt-10 gap-4">
                        <button
                            onClick={() => setShowDespatchModal(false)}
                            className="px-8 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-white font-medium transition-all"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleFinalSendDespatch}
                            disabled={isSendingDespatch}
                            className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:-translate-y-0.5 transition-all"
                        >
                            {isSendingDespatch ? 'GÖNDERİLİYOR...' : 'Resmileştir ve Gönder'}
                        </button>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.85);
                    backdrop-filter: blur(12px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .glass {
                    background: rgba(23, 23, 23, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                }
            `}</style>
        </div>
    );
}
