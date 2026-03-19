"use client";

import { useState, useEffect, useMemo } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { BookOpen, RefreshCw, Plus, Search, FileText, CornerDownRight, AlertCircle } from 'lucide-react';
import LedgerDetailModal from './LedgerDetailModal';

interface Account {
    id: string;
    code: string;
    name: string;
    parentCode: string | null;
    type: string;
    accountClass?: string;
    normalBalance?: string;
    // balance: number; // Deprecated in UI
    debitBalance: number;
    creditBalance: number;
    warnings?: string[];
    isActive: boolean;
}

export default function AccountPlanContent() {
    const { showSuccess, showError } = useModal();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // New Account Form State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAccount, setNewAccount] = useState({
        code: '',
        name: '',
        parentCode: '',
        type: 'Borç'
    });

    // Ledger Modal State
    const [showLedgerModal, setShowLedgerModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/financials/accounts');
            const data = await res.json();
            if (data.success) {
                setAccounts(data.accounts);
            }
        } catch (error) {
            console.error(error);
            showError('Hata', 'Hesap planı yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const openLedger = (account: Account) => {
        setSelectedAccount(account);
        setShowLedgerModal(true);
    };

    const filteredAccounts = useMemo(() => {
        if (!searchTerm) return accounts;
        const lowerTerm = searchTerm.toLowerCase();
        return accounts.filter(acc =>
            acc.code.toLowerCase().includes(lowerTerm) ||
            acc.name.toLowerCase().includes(lowerTerm)
        );
    }, [accounts, searchTerm]);

    const handleAddAccount = async () => {
        if (!newAccount.code || !newAccount.name) {
            showError('Uyarı', 'Hesap kodu ve adı zorunludur.');
            return;
        }

        try {
            const res = await fetch('/api/financials/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAccount)
            });
            const data = await res.json();

            if (data.success) {
                showSuccess('Başarılı', 'Hesap oluşturuldu.');
                setShowAddModal(false);
                setNewAccount({ code: '', name: '', parentCode: '', type: 'Borç' });
                fetchAccounts();
            } else {
                showError('Hata', data.error || 'Hesap oluşturulamadı.');
            }
        } catch (error) {
            showError('Hata', 'Sunucu hatası.');
        }
    };

    const prepareSubAccount = (parent: Account) => {
        let suggestedCode = parent.code + '.';
        const children = accounts.filter(a => a.parentCode === parent.code);
        if (children.length > 0) {
            // Logic can be added here
        }

        setNewAccount({
            code: suggestedCode,
            name: '',
            parentCode: parent.code,
            type: parent.type
        });
        setShowAddModal(true);
    };

    const [syncing, setSyncing] = useState(false);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch('/api/financials/accounts/sync', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                showSuccess('Başarılı', 'Hesaplar ve bakiyeler eşitlendi.');
                fetchAccounts();
            } else {
                showError('Hata', data.error || 'Eşitleme başarısız.');
            }
        } catch (e) {
            showError('Hata', 'Sunucu hatası.');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                Tek Düzen Hesap Planı
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                                Resmi muhasebe kayıtları için alt gruplu hesap ağacı yönetimi.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className={`px-4 h-11 rounded-xl font-bold text-[13px] text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 flex items-center gap-2 transition-all shadow-sm ${syncing ? 'opacity-50 pointer-events-none' : ''}`}
                            title="Kasalar ve Komisyonları Kontrol Et"
                        >
                            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">{syncing ? 'Eşitleniyor...' : 'Hesapları Eşitle'}</span>
                        </button>
                        <button
                            onClick={fetchAccounts}
                            className="w-11 h-11 rounded-xl font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition-all bg-white dark:bg-[#1e293b] shadow-sm"
                            title="Yenile"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                setNewAccount({ code: '', name: '', parentCode: '', type: 'Borç' });
                                setShowAddModal(true);
                            }}
                            className="px-4 h-11 rounded-xl font-bold text-[13px] text-white shadow-md bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 flex items-center gap-2 transition-all"
                        >
                            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Ana Hesap Ekle</span>
                        </button>
                    </div>
                </div>

                <div className="mt-6 relative group">
                    <Search className="w-5 h-5 absolute left-4 top-[14px] text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Hesap kodu veya adı ile ağaçta hızlı ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-[13px] font-semibold h-[48px] pl-11 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#F6F8FB] dark:bg-[#0F172A] border-b border-slate-200 dark:border-white/10 font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-4 tracking-wider uppercase text-[10px] font-black text-slate-500 dark:text-slate-400 text-left">HESAP KODU</th>
                                <th className="p-4 tracking-wider uppercase text-[10px] font-black text-slate-500 dark:text-slate-400 text-left">HESAP ADI</th>
                                <th className="p-4 tracking-wider uppercase text-[10px] font-black text-slate-500 dark:text-slate-400 text-left">SINIF</th>
                                <th className="p-4 tracking-wider uppercase text-[10px] font-black text-slate-500 dark:text-slate-400 text-left">YÖN</th>
                                <th className="p-4 tracking-wider uppercase text-[10px] font-black text-slate-500 dark:text-slate-400 text-right">BORÇ BAKİYESİ</th>
                                <th className="p-4 tracking-wider uppercase text-[10px] font-black text-slate-500 dark:text-slate-400 text-right">ALACAK BAKİYESİ</th>
                                <th className="p-4 tracking-wider uppercase text-[10px] font-black text-slate-500 dark:text-slate-400 text-center w-[100px]">İŞLEM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                                        Hesap planı yükleniyor...
                                    </td>
                                </tr>
                            ) : filteredAccounts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                                        Kayıtlı hesap bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                filteredAccounts?.map((acc) => {
                                    const depth = acc.code.split('.').length - 1;
                                    const isMain = depth === 0;

                                    return (
                                        <tr key={acc.id} className={`h-[52px] border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${isMain ? 'bg-slate-50/30 dark:bg-slate-800/20' : ''}`}>
                                            <td className={`px-4 py-2 font-semibold text-[13px] font-mono ${isMain ? 'font-black text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                <div className="flex items-center gap-2">
                                                    <span style={{ marginLeft: `${Math.min(depth * 16, 64)}px` }} className="flex items-center gap-1.5">
                                                        {!isMain && <CornerDownRight className="w-3.5 h-3.5 text-slate-400" />}
                                                        {acc.code}
                                                    </span>
                                                    {acc.warnings && acc.warnings.length > 0 && (
                                                        <div className="group/warning relative">
                                                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 cursor-warning animate-pulse" />
                                                            <div className="absolute left-6 top-0 w-64 p-3 bg-slate-900 border border-amber-500/30 rounded-xl text-[11px] font-semibold text-amber-100 invisible group-hover/warning:visible z-50 shadow-xl pointer-events-none">
                                                                {acc.warnings.join(', ')}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={`p-4 text-[13px] ${isMain ? 'font-black text-slate-900 dark:text-white' : 'font-semibold text-slate-600 dark:text-slate-400'}`}>
                                                {acc.name}
                                            </td>
                                            <td className="px-4 py-2 font-semibold text-[13px]">
                                                {acc.accountClass ? (
                                                    <span className={`
                                                        text-[10px] px-2 py-0.5 rounded font-black tracking-widest uppercase
                                                        ${acc.accountClass === 'AKTIF' || acc.accountClass === 'GIDER' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}
                                                    `}>
                                                        {acc.accountClass}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 dark:text-slate-600 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 font-semibold text-[13px] hidden md:table-cell">
                                                {acc.normalBalance ? (
                                                    <span className={`text-xs font-mono opacity-70 ${acc.normalBalance === 'BORC' ? 'text-blue-600 dark:text-blue-400' : 'text-rose-400'}`}>
                                                        {acc.normalBalance}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-mono opacity-50">{acc.type}</span>
                                                )}
                                            </td>

                                            {/* BORÇ BAKİYESİ */}
                                            <td className="px-4 py-2 font-semibold text-[13px] text-right font-mono font-bold">
                                                {acc.debitBalance > 0 ? (
                                                    <span className="text-blue-600 dark:text-blue-400">
                                                        {acc.debitBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-700">-</span>
                                                )}
                                            </td>

                                            {/* ALACAK BAKİYESİ */}
                                            <td className="px-4 py-2 font-semibold text-[13px] text-right font-mono font-bold">
                                                {acc.creditBalance > 0 ? (
                                                    <span className="text-rose-600 dark:text-rose-400">
                                                        {acc.creditBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-700">-</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-2 font-semibold text-[13px] text-center">
                                                <div className="flex justify-center items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openLedger(acc)}
                                                        className="w-8 h-8 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10 flex items-center justify-center transition-all bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm"
                                                        title="Hesap Hareketleri (Muavin Defter)"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => prepareSubAccount(acc)}
                                                        className="w-8 h-8 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10 flex items-center justify-center transition-all bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm"
                                                        title="Alt Hesap Ekle"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ADD ACCOUNT MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80  z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[24px] w-full max-w-md p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-6">
                            {newAccount.parentCode ? `Alt Hesap Ekle (${newAccount.parentCode})` : 'Yeni Ana Hesap Ekle'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">HESAP KODU</label>
                                <input
                                    type="text"
                                    className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-[12px] p-3 focus:border-blue-500 outline-none"
                                    placeholder={newAccount.parentCode ? `${newAccount.parentCode}.01` : '100'}
                                    value={newAccount.code}
                                    onChange={e => setNewAccount({ ...newAccount, code: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">HESAP ADI</label>
                                <input
                                    type="text"
                                    className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-[12px] p-3 focus:border-blue-500 outline-none"
                                    placeholder="Örn: AKBANK TL HESABI"
                                    value={newAccount.name}
                                    onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">HESAP TİPİ</label>
                                    <select
                                        className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-[12px] p-3 outline-none"
                                        value={newAccount.type}
                                        onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}
                                        disabled={!!newAccount.parentCode}
                                    >
                                        <option value="Borç">Borç (Aktif/Gider)</option>
                                        <option value="Alacak">Alacak (Pasif/Gelir)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-4 text-[13px] h-[52px] rounded-[12px] bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleAddAccount}
                                className="flex-1 py-4 text-[13px] h-[52px] rounded-[12px] bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white font-bold transition-colors shadow-sm "
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LEDGER MODAL (YENİ MUAVİN DEFTER) */}
            <LedgerDetailModal
                isOpen={showLedgerModal}
                onClose={() => setShowLedgerModal(false)}
                account={selectedAccount}
            />
        </div>
    );
}
