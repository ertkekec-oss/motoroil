"use client";

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Search, Plus, ShieldCheck, PenTool, Handshake, CheckCircle2, UserCheck, Smartphone } from 'lucide-react';
import Pagination from '@/components/Pagination';

const ITEMS_PER_PAGE = 10;

export default function AssetAssignmentsPage() {
    const { currentUser, staff } = useApp(); // We use global staff
    const { showSuccess, showError, showWarning } = useModal();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const [assignments, setAssignments] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]); // To list assignable assets
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // SMS OTP (Digital Signature) Simulation State
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);

    const [newAssignment, setNewAssignment] = useState({
        assetId: '',
        staffId: '',
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [assData, astData] = await Promise.all([
                fetch('/api/assets/assignments').then(r => r.json()),
                fetch('/api/assets').then(r => r.json())
            ]);
            
            if (assData.success) setAssignments(assData.data);
            if (astData.success) {
                // Sadece Zimmetlenebilir (boşta olan) cihazları filtrele
                const available = astData.data.filter((a: any) => 
                     !a.assignments || a.assignments.length === 0 || a.assignments[0]?.returnedAt
                );
                setAssets(available);
            }
        } catch (error) {
            console.error('Error fetching assignments data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!newAssignment.assetId || !newAssignment.staffId) {
            showError("Eksik Bilgi", "Lütfen personeli ve demirbaşı seçin.");
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch('/api/assets/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAssignment)
            });
            const data = await res.json();
            if (data.success) {
                showSuccess("Tutak Oluşturuldu", "Zimmet tutanağı oluşturuldu, personelin dijital imzası bekleniyor.");
                setIsAssignModalOpen(false);
                setNewAssignment({ assetId: '', staffId: '', notes: '' });
                fetchData();
            } else {
                showError("Hata", data.error || "Beklenmeyen hata oluştu.");
            }
        } catch (error) {
            showError("Hata", "Kayıt başarısız.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) value = value.slice(-1);
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleSignDocument = async () => {
        const fullOtp = otp.join("");
        if (fullOtp.length < 6) return;
        
        setIsProcessing(true);
        try {
            const res = await fetch('/api/assets/assignments/sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignmentId: selectedAssignment.id, otp: fullOtp })
            });

            const data = await res.json();
            if (data.success) {
                showSuccess("Başarılı", "Zimmet tutanağı dijital olarak imzalandı.");
                setIsOtpModalOpen(false);
                setOtp(["", "", "", "", "", ""]);
                setSelectedAssignment(null);
                fetchData();
            } else {
                showWarning("Reddedildi", data.error || "SMS kodu hatalı.");
            }
        } catch (error) {
            showError("Hata", "İmza atılırken sistemsel bir hata oluştu.");
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredAssignments = assignments.filter(a => 
         (a.asset?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
         (a.staff?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredAssignments.length / ITEMS_PER_PAGE);
    const paginatedAssignments = filteredAssignments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const cardClass = isLight ? "bg-white border border-slate-200 shadow-sm" : "bg-slate-900 border border-slate-800";
    const textLabelClass = isLight ? "text-slate-500" : "text-slate-400";
    const textValueClass = isLight ? "text-slate-900" : "text-white";

    return (
        <div data-pos-theme={theme} className={`w-full min-h-[100vh] px-8 py-8 space-y-6 transition-colors duration-300 font-sans ${isLight ? 'bg-[#FAFAFA]' : ''}`}>
            
            <div className={`p-6 rounded-[24px] border ${cardClass} flex items-center justify-between`}>
                <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-[12px] flex items-center justify-center shadow-lg shadow-blue-600/20 text-white">
                        <Handshake className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className={`text-[20px] font-bold ${textValueClass}`}>Zimmet Merkezi</h2>
                        <p className={`text-[12px] mt-0.5 ${textLabelClass}`}>Varlık teslim tutanakları ve dijital imza işlemleri</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="h-[44px] px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-bold text-[13px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-5 h-5" />
                    BİRİM / PERSONELE ZİMMETLE
                </button>
            </div>

            <div className={`mt-6 rounded-[24px] border flex flex-col overflow-hidden shadow-sm ${cardClass}`}>
                <div className={`p-4 flex flex-wrap justify-between items-center gap-4 border-b ${isLight ? 'border-slate-200 bg-white' : 'border-white/5 bg-[#0f172a]'}`}>
                    <h3 className="text-[13px] font-black uppercase tracking-widest hidden sm:block">ZİMMET HAREKETLERİ</h3>
                    
                    <div className="relative w-full sm:w-[280px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                            placeholder="Personel adı veya cihaz ara..."
                            className={`w-full pl-9 pr-4 h-[38px] rounded-[8px] border text-[13px] font-bold outline-none transition-all focus:border-blue-500 shadow-sm ${isLight ? 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400' : 'bg-black/20 border-white/10 text-white placeholder:text-slate-500'}`}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className={`text-[11px] font-semibold uppercase tracking-widest ${isLight ? 'bg-slate-50 text-slate-500' : 'bg-[#1e293b] text-slate-400'}`}>
                        <tr>
                            <th className="px-6 py-4 border-b border-inherit">Durum</th>
                            <th className="px-6 py-4 border-b border-inherit">Varlık Bilgisi</th>
                            <th className="px-6 py-4 border-b border-inherit">Teslim Alan</th>
                            <th className="px-6 py-4 border-b border-inherit">Zimmet Tarihi</th>
                            <th className="px-6 py-4 border-b border-inherit text-right">İşlem</th>
                        </tr>
                        </thead>
                        <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
                            {isLoading ? (
                                <tr><td colSpan={5} className="text-center py-12 text-slate-500">Yükleniyor...</td></tr>
                            ) : paginatedAssignments.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-12 text-slate-500">Zimmet kaydı bulunamadı.</td></tr>
                            ) : paginatedAssignments.map(a => (
                                <tr key={a.id} className={`h-[54px] transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1e293b]/50'}`}>
                                    <td className="px-6 py-3 align-middle text-[12px]">
                                        {a.status === 'RETURNED' ? (
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] font-bold ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'}`}>
                                                İade Edildi
                                            </span>
                                        ) : a.isSigned ? (
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] font-bold ${isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                <CheckCircle2 className="w-3.5 h-3.5" /> İmzalandı & Aktif
                                            </span>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] font-bold ${isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400'}`}>
                                                <PenTool className="w-3.5 h-3.5" /> İmza Bekliyor
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 align-middle">
                                        <div className={`font-bold text-[14px] ${textValueClass}`}>{a.asset?.name || 'Bilinmeyen Varlık'}</div>
                                        <div className="text-[11px] opacity-60 font-mono tracking-widest">{a.asset?.barcode}</div>
                                    </td>
                                    <td className="px-6 py-3 align-middle">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-[11px]">
                                                {a.staff?.name?.charAt(0) || '?'}
                                            </div>
                                            <div className={`font-bold text-[13px] ${textValueClass}`}>{a.staff?.name || '-'}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 align-middle text-[12px] opacity-70 font-medium">
                                        {new Date(a.assignedAt).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-3 align-middle text-[12px] text-right">
                                        {a.status === 'ACTIVE' && !a.isSigned && (
                                            <button 
                                                onClick={() => {setSelectedAssignment(a); setIsOtpModalOpen(true);}}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-[11px] shadow-sm ml-auto"
                                            >
                                                PERSONEL İMZASI (MFA)
                                            </button>
                                        )}
                                        {a.status === 'ACTIVE' && a.isSigned && (
                                            <button className={`px-3 py-1.5 rounded-md font-bold text-[11px] shadow-sm ml-auto border ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                                                İade Al
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className={`pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <Pagination currentPage={currentPage} totalPages={totalPages > 0 ? totalPages : 1} onPageChange={setCurrentPage} />
                </div>
            </div>

            {/* ASSIGN MODAL */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm z-[9999]">
                    <div className={`w-full max-w-[540px] rounded-[24px] shadow-2xl animate-in zoom-in-95 ${cardClass}`}>
                        <div className={`p-6 border-b flex justify-between items-center ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                            <h3 className={`text-[18px] font-bold ${textValueClass}`}>Yeni Zimmet Oluştur</h3>
                            <button onClick={() => setIsAssignModalOpen(false)} className={`text-[20px] ${textLabelClass}`}>&times;</button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${textLabelClass}`}>Varlık Seç (Depodan)</label>
                                <select 
                                    value={newAssignment.assetId} 
                                    onChange={e => setNewAssignment({...newAssignment, assetId: e.target.value})}
                                    className={`w-full px-3 py-3 rounded-[12px] text-[13px] border outline-none ${isLight ? 'bg-slate-50 border-slate-200 focus:border-blue-500' : 'bg-black/20 border-white/10 focus:border-blue-500'}`}
                                >
                                    <option value="">-- Zimmetlenebilir Varlıklar --</option>
                                    {assets.map(a => <option key={a.id} value={a.id}>{a.name} (Sn: {a.serialNumber || 'Bilinmiyor'})</option>)}
                                </select>
                            </div>

                            <div>
                                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1 ${textLabelClass}`}>
                                    <UserCheck className="w-3.5 h-3.5"/> Personel Seç
                                </label>
                                <select 
                                    value={newAssignment.staffId} 
                                    onChange={e => setNewAssignment({...newAssignment, staffId: e.target.value})}
                                    className={`w-full px-3 py-3 rounded-[12px] text-[13px] font-bold border outline-none ${isLight ? 'bg-slate-50 border-slate-200 focus:border-blue-500' : 'bg-black/20 border-white/10 focus:border-blue-500'}`}
                                >
                                    <option value="">-- Personel Seçiniz --</option>
                                    {staff.map(s => <option key={s.id} value={s.id}>{s.name} - {s.role}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1 ${textLabelClass}`}>
                                    Notlar / Tutanak Açıklaması
                                </label>
                                <textarea 
                                    rows={3}
                                    placeholder="Cihaz sağlam teslim edildi, çizik yok."
                                    value={newAssignment.notes} 
                                    onChange={e => setNewAssignment({...newAssignment, notes: e.target.value})}
                                    className={`w-full px-3 py-3 rounded-[12px] text-[13px] border outline-none resize-none ${isLight ? 'bg-slate-50 border-slate-200 focus:border-blue-500' : 'bg-black/20 border-white/10 focus:border-blue-500'}`}
                                />
                            </div>

                            <button 
                                onClick={handleAssign} 
                                disabled={isProcessing} 
                                className={`w-full py-4 rounded-[12px] text-[14px] font-black tracking-widest text-white transition-all bg-blue-600 hover:bg-blue-700 shadow-md ${isProcessing ? 'opacity-70' : ''}`}
                            >
                                {isProcessing ? 'İŞLENİYOR...' : 'TUTANAK OLUŞTUR'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* OTP - DIGITAL SIGNATURE MODAL */}
            {isOtpModalOpen && selectedAssignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm z-[9999]">
                    <div className={`w-full max-w-[420px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 ${isLight ? 'bg-white' : 'bg-slate-900 border border-slate-800'}`}>
                        <div className="p-8 pb-6 flex flex-col items-center justify-center border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 mb-4">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <h3 className={`text-[20px] font-black text-center ${textValueClass}`}>Dijital İmza Onayı</h3>
                            <p className="text-[12px] text-center text-slate-500 dark:text-slate-400 mt-2">
                                <strong>{selectedAssignment.staff?.name}</strong> için hazırlanan zimmet belgesi sisteme yüklenmiştir. Onay için personelin telefonuna giden kodu giriniz.
                            </p>
                            <p className="text-[10px] text-center text-blue-500 mt-1">(Demo: 123456 yazarak geçebilirsiniz)</p>
                        </div>
                        <div className="p-8 space-y-6 flex flex-col items-center">
                            <div className="flex gap-2 justify-center w-full">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`otp-${index}`}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        className={`w-12 h-14 text-center text-[24px] font-bold rounded-[12px] border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-white focus:border-blue-500'}`}
                                    />
                                ))}
                            </div>
                            <div className="flex w-full gap-3 mt-4">
                                <button 
                                    onClick={() => setIsOtpModalOpen(false)} 
                                    className={`flex-1 py-3.5 rounded-[12px] text-[13px] font-bold transition-all border ${isLight ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600' : 'bg-[#0f172a] border-slate-700 hover:bg-slate-800 text-slate-300'}`}
                                >
                                    İptal
                                </button>
                                <button 
                                    onClick={handleSignDocument}
                                    disabled={otp.join('').length < 6 || isProcessing}
                                    className="flex-[2] py-3.5 rounded-[12px] text-[13px] font-black tracking-widest text-white transition-all bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Smartphone className="w-4 h-4"/> İMZALA & ONAYLA
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
