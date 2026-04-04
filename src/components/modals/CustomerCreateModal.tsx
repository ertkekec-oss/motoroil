"use client";

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useCRM } from '@/contexts/CRMContext';
import { useModal } from '@/contexts/ModalContext';
import { TURKISH_CITIES, TURKISH_DISTRICTS } from '@/lib/constants';
import { useTheme } from '@/contexts/ThemeContext';

interface CustomerCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (newCustomer: any) => void;
    initialPhone?: string;
    initialName?: string;
}

export default function CustomerCreateModal({ isOpen, onClose, onSuccess, initialPhone = '', initialName = '' }: CustomerCreateModalProps) {
    const { currentUser, branches, activeBranchName } = useApp();
    const { custClasses } = useCRM();
    const { showSuccess, showError, showWarning } = useModal();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const [isProcessing, setIsProcessing] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: initialName,
        phone: initialPhone,
        email: '',
        address: '',
        city: 'İstanbul',
        district: '',
        taxNumber: '',
        taxOffice: '',
        contactPerson: '',
        iban: '',
        customerClass: '',
        referredByCode: '',
        branch: activeBranchName || currentUser?.branch || 'Merkez'
    });

    if (!isOpen) return null;

    const handleAddCustomer = async () => {
        if (!newCustomer.name) {
            showWarning("Eksik Bilgi", "İsim zorunludur!");
            return;
        }

        if (isProcessing) return;

        setIsProcessing(true);
        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCustomer)
            });
            const data = await res.json();
            if (data.success) {
                showSuccess("Başarılı", "Müşteri başarıyla oluşturuldu.");
                if (onSuccess) {
                    onSuccess(data.customer || newCustomer); // Pass the created customer back
                } else {
                    window.location.reload();
                }
                onClose();
            } else {
                showError("Hata", data.error || "Beklenmedik bir hata oluştu.");
            }
        } catch (error: any) {
            console.error(error);
            showError("Hata", "Müşteri eklenirken bir hata oluştu.");
        } finally {
            setIsProcessing(false);
        }
    };

    const cardClass = isLight
        ? "bg-white border border-slate-200 shadow-sm"
        : "bg-slate-900 border border-slate-800";

    const textLabelClass = isLight ? "text-slate-500" : "text-slate-400";
    const textValueClass = isLight ? "text-slate-900" : "text-white";

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className={`w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[24px] shadow-2xl animate-in fade-in zoom-in-95 ${cardClass}`}>
                <div className={`p-6 border-b flex justify-between items-center sticky top-0 bg-inherit z-10 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <h3 className={`text-[18px] font-semibold ${textValueClass}`}>Yeni Müşteri Ekle</h3>
                    <button onClick={onClose} className={`text-[20px] leading-none ${textLabelClass} hover:${textValueClass}`}>&times;</button>
                </div>
                <div className="p-6 space-y-0 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-1">
                        <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Ad Soyad / Unvan <span className="text-red-500">*</span></label>
                        <input type="text" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                    </div>
                    <div className="md:col-span-1">
                        <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Yetkili Kişi</label>
                        <input type="text" value={newCustomer.contactPerson} onChange={e => setNewCustomer({ ...newCustomer, contactPerson: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                    </div>

                    <div className="md:col-span-1">
                        <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Telefon</label>
                        <input type="text" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                    </div>
                    <div className="md:col-span-1">
                        <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>E-Posta</label>
                        <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                    </div>

                    <div className="md:col-span-1">
                        <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Sınıf</label>
                        <select value={newCustomer.customerClass} onChange={e => setNewCustomer({ ...newCustomer, customerClass: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`}>
                            <option value="">Seçiniz...</option>
                            {(custClasses || []).map(cls => <option key={cls} value={cls}>{cls}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Şube <span className="text-red-500">*</span></label>
                        <select value={newCustomer.branch} onChange={e => setNewCustomer({ ...newCustomer, branch: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`}>
                            <option value="">-- Şube Seçiniz --</option>
                            {(branches || []).map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                        </select>
                    </div>

                    <div className="md:col-span-1">
                        <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Vergi No / TC</label>
                        <input type="text" value={newCustomer.taxNumber} onChange={e => setNewCustomer({ ...newCustomer, taxNumber: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                    </div>
                    <div className="md:col-span-1">
                        <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Vergi Dairesi</label>
                        <input type="text" value={newCustomer.taxOffice} onChange={e => setNewCustomer({ ...newCustomer, taxOffice: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                    </div>

                    <div className="md:col-span-2">
                        <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>IBAN</label>
                        <input type="text" placeholder="TR..." value={newCustomer.iban} onChange={e => setNewCustomer({ ...newCustomer, iban: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                    </div>

                    <div className="md:col-span-1">
                        <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>İl</label>
                        <select value={newCustomer.city} onChange={e => setNewCustomer({ ...newCustomer, city: e.target.value, district: '' })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`}>
                            <option value="">Seçiniz...</option>
                            {TURKISH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>İlçe</label>
                        <select value={newCustomer.district} onChange={e => setNewCustomer({ ...newCustomer, district: e.target.value })} disabled={!newCustomer.city} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`}>
                            <option value="">Seçiniz...</option>
                            {(TURKISH_DISTRICTS[newCustomer.city] || []).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Açık Adres</label>
                        <textarea rows={3} value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none resize-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                    </div>

                    <div className="md:col-span-2 pt-2">
                        <button onClick={handleAddCustomer} disabled={isProcessing} className={`w-full py-3.5 rounded-full text-[14px] font-semibold text-white transition-colors shadow-sm ${isLight ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-500'} ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}>
                            {isProcessing ? 'Kaydediliyor...' : 'Müşteriyi Kaydet'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
