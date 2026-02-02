"use client";

import { useState, useEffect, useMemo } from 'react';
import { useModal } from '@/contexts/ModalContext';
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
        <div className="animate-fade-in-up">
            <div className="card glass mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            📑 Tek Düzen Hesap Planı
                        </h2>
                        <p className="text-muted text-sm mt-1">
                            Resmi muhasebe kayıtları için hesap ağacı yönetimi.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className={`btn btn-outline btn-warning btn-sm ${syncing ? 'loading' : ''}`}
                            title="Kasalar ve Komisyonları Kontrol Et"
                        >
                            {syncing ? 'Eşitleniyor...' : '⚠️ Hesapları Eşitle'}
                        </button>
                        <button
                            onClick={fetchAccounts}
                            className="btn btn-ghost btn-sm"
                        >
                            🔄 Yenile
                        </button>
                        <button
                            onClick={() => {
                                setNewAccount({ code: '', name: '', parentCode: '', type: 'Borç' });
                                setShowAddModal(true);
                            }}
                            className="btn btn-primary"
                        >
                            + Ana Hesap Ekle
                        </button>
                    </div>
                </div>

                <div className="mt-6 relative">
                    <input
                        type="text"
                        placeholder="Hesap Kodu veya Adı ile ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pl-12 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <span className="absolute left-4 top-3.5 text-gray-400">🔍</span>
                </div>
            </div>

            <div className="card glass overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-sm font-bold text-gray-400 border-b border-white/5">
                                <th className="p-4 w-48">HESAP KODU</th>
                                <th className="p-4">HESAP ADI</th>
                                <th className="p-4 w-32">SINIF</th>
                                <th className="p-4 w-32 hidden md:table-cell">YÖN</th>
                                <th className="p-4 text-right w-40 text-blue-300">BORÇ BAKİYESİ</th>
                                <th className="p-4 text-right w-40 text-rose-300">ALACAK BAKİYESİ</th>
                                <th className="p-4 w-24 text-center">İŞLEM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        Hesap planı yükleniyor...
                                    </td>
                                </tr>
                            ) : filteredAccounts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        Kayıtlı hesap bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                filteredAccounts.map((acc) => {
                                    const depth = acc.code.split('.').length - 1;
                                    const isMain = depth === 0;

                                    return (
                                        <tr
                                            key={acc.id}
                                            className={`
                                                border-b border-white/5 hover:bg-white/5 transition-colors
                                                ${isMain ? 'bg-white/[0.02]' : ''}
                                            `}
                                        >
                                            <td className="p-4 font-mono font-bold text-blue-300">
                                                <div className="flex items-center gap-2">
                                                    <span style={{ marginLeft: `${depth * 20}px` }}>
                                                        {isMain ? '' : '└─ '}
                                                        {acc.code}
                                                    </span>
                                                    {acc.warnings && acc.warnings.length > 0 && (
                                                        <div className="group relative">
                                                            <span className="text-yellow-500 cursor-warning animate-pulse">⚠️</span>
                                                            <div className="absolute left-6 top-0 w-64 p-2 bg-black/90 border border-yellow-500/30 rounded text-xs text-yellow-200 invisible group-hover:visible z-50">
                                                                {acc.warnings.join(', ')}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={`p-4 ${isMain ? 'font-bold text-white' : 'text-gray-300'}`}>
                                                {acc.name}
                                            </td>
                                            <td className="p-4">
                                                {acc.accountClass ? (
                                                    <span className={`
                                                        text-xs px-2 py-1 rounded-md font-bold
                                                        ${acc.accountClass === 'AKTIF' || acc.accountClass === 'GIDER' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}
                                                    `}>
                                                        {acc.accountClass}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-600 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 hidden md:table-cell">
                                                {acc.normalBalance ? (
                                                    <span className={`text-xs font-mono opacity-70 ${acc.normalBalance === 'BORC' ? 'text-blue-400' : 'text-rose-400'}`}>
                                                        {acc.normalBalance}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-mono opacity-50">{acc.type}</span>
                                                )}
                                            </td>

                                            {/* BORÇ BAKİYESİ */}
                                            <td className="p-4 text-right font-mono font-bold">
                                                {acc.debitBalance > 0 ? (
                                                    <span className="text-blue-300">
                                                        {acc.debitBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-700">-</span>
                                                )}
                                            </td>

                                            {/* ALACAK BAKİYESİ */}
                                            <td className="p-4 text-right font-mono font-bold">
                                                {acc.creditBalance > 0 ? (
                                                    <span className="text-rose-300">
                                                        {acc.creditBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-700">-</span>
                                                )}
                                            </td>

                                            <td className="p-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => openLedger(acc)}
                                                        className="btn btn-ghost btn-xs text-yellow-400 hover:bg-yellow-500/10"
                                                        title="Hesap Hareketleri (Ekstre)"
                                                    >
                                                        📜
                                                    </button>
                                                    <button
                                                        onClick={() => prepareSubAccount(acc)}
                                                        className="btn btn-ghost btn-xs text-blue-400 hover:bg-blue-500/10"
                                                        title="Alt Hesap Ekle"
                                                    >
                                                        + Alt
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
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-6">
                            {newAccount.parentCode ? `Alt Hesap Ekle (${newAccount.parentCode})` : 'Yeni Ana Hesap Ekle'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-2">HESAP KODU</label>
                                <input
                                    type="text"
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 focus:border-blue-500 outline-none"
                                    placeholder={newAccount.parentCode ? `${newAccount.parentCode}.01` : '100'}
                                    value={newAccount.code}
                                    onChange={e => setNewAccount({ ...newAccount, code: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-2">HESAP ADI</label>
                                <input
                                    type="text"
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 focus:border-blue-500 outline-none"
                                    placeholder="Örn: AKBANK TL HESABI"
                                    value={newAccount.name}
                                    onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-2">HESAP TİPİ</label>
                                    <select
                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 outline-none"
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
                                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleAddAccount}
                                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-lg shadow-blue-500/20"
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
