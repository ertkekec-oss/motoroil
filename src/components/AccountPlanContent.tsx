"use client";

import { useState, useEffect, useMemo } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { BookOpen, RefreshCw, Plus, Search, FileText, AlertCircle, ChevronRight, ChevronDown, Folder, Wallet, TrendingUp, TrendingDown, Landmark, Network } from 'lucide-react';
import LedgerDetailModal from './LedgerDetailModal';

interface Account {
    id: string;
    code: string;
    name: string;
    parentCode: string | null;
    type: string;
    accountClass?: string;
    normalBalance?: string;
    debitBalance: number;
    creditBalance: number;
    warnings?: string[];
    isActive: boolean;
    children?: Account[];
}

const AccountTreeNode = ({ 
    account, 
    level = 0, 
    searchTerm, 
    onAddSubAccount, 
    onOpenLedger 
}: { 
    account: Account, 
    level?: number, 
    searchTerm: string,
    onAddSubAccount: (p: Account) => void,
    onOpenLedger: (p: Account) => void
}) => {
    const [isExpanded, setIsExpanded] = useState(level < 1 || !!searchTerm);

    // Auto-expand if searching
    useEffect(() => {
        if (searchTerm) setIsExpanded(true);
    }, [searchTerm]);

    const hasChildren = account.children && account.children.length > 0;
    const isMain = level === 0;

    return (
        <div className="flex flex-col w-full">
            <div 
                className={`flex items-center justify-between p-3 border-b border-slate-100 dark:border-white/5 transition-colors group
                ${isMain ? 'bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}
                ${!isMain && level > 0 ? 'ml-6 border-l border-l-slate-200 dark:border-l-slate-700' : ''}`}
            >
                <div className="flex items-center gap-3 flex-1">
                    {/* Expand/Collapse Toggle */}
                    <div 
                        className={`w-5 h-5 flex items-center justify-center rounded cursor-pointer transition-colors ${hasChildren ? 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500' : 'opacity-0 pointer-events-none'}`}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className={`font-mono text-[13px] ${isMain ? 'font-black text-indigo-600 dark:text-indigo-400' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                                {account.code}
                            </span>
                            <span className={`text-[13px] ${isMain ? 'font-black text-slate-900 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-400'}`}>
                                {account.name}
                            </span>
                            {account.warnings && account.warnings.length > 0 && (
                                <div className="group/warning relative ml-2">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 cursor-warning animate-pulse" />
                                    <div className="absolute left-6 top-0 w-64 p-3 bg-slate-900 border border-amber-500/30 rounded-xl text-[11px] font-semibold text-amber-100 invisible group-hover/warning:visible z-50 shadow-xl pointer-events-none">
                                        {account.warnings.join(', ')}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 md:gap-12 w-[400px] justify-end pr-4">
                    <div className="text-right w-24">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">BORÇ</span>
                        <span className={`font-mono text-[13px] font-bold ${account.debitBalance > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}>
                            {account.debitBalance > 0 ? account.debitBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-'}
                        </span>
                    </div>
                    <div className="text-right w-24">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">ALACAK</span>
                        <span className={`font-mono text-[13px] font-bold ${account.creditBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-300 dark:text-slate-700'}`}>
                            {account.creditBalance > 0 ? account.creditBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-'}
                        </span>
                    </div>

                    <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity w-20">
                        <button
                            onClick={() => onOpenLedger(account)}
                            className="w-8 h-8 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10 flex items-center justify-center transition-all bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm"
                            title="Hesap Hareketleri (Muavin Defter)"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onAddSubAccount(account)}
                            className="w-8 h-8 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10 flex items-center justify-center transition-all bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm"
                            title="Alt Hesap Ekle"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {isExpanded && hasChildren && (
                <div className="flex flex-col w-full">
                    {account.children!.map(child => (
                        <AccountTreeNode 
                            key={child.id} 
                            account={child} 
                            level={level + 1} 
                            searchTerm={searchTerm} 
                            onAddSubAccount={onAddSubAccount}
                            onOpenLedger={onOpenLedger}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function AccountPlanContent() {
    const { showSuccess, showError } = useModal();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    // Mappings and States
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAccount, setNewAccount] = useState({ code: '', name: '', parentCode: '', type: 'Borç' });
    const [showLedgerModal, setShowLedgerModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [syncing, setSyncing] = useState(false);

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

    // Tree Builder
    const buildTree = (flatList: Account[]) => {
        const tree: Account[] = [];
        const lookup: Record<string, Account> = {};

        // 1. Initialize lookup
        flatList.forEach(a => {
            lookup[a.code] = { ...a, children: [] };
        });

        // 2. Build linkages
        flatList.forEach(a => {
            const node = lookup[a.code];
            if (a.parentCode && lookup[a.parentCode]) {
                lookup[a.parentCode].children!.push(node);
            } else {
                tree.push(node);
            }
        });

        // 3. Sort nodes by code
        const sortTree = (nodes: Account[]) => {
            nodes.sort((x, y) => x.code.localeCompare(y.code));
            nodes.forEach(n => {
                if (n.children && n.children.length > 0) {
                    sortTree(n.children);
                }
            });
        };
        sortTree(tree);

        return tree;
    };

    const getGroupFilter = (tabId: string) => {
        switch (tabId) {
            case 'assets': return (c: string) => c.startsWith('1') || c.startsWith('2');
            case 'liabilities': return (c: string) => c.startsWith('3') || c.startsWith('4') || c.startsWith('5');
            case 'income_expense': return (c: string) => c.startsWith('6') || c.startsWith('7');
            default: return () => true;
        }
    };

    const filteredAccounts = useMemo(() => {
        let filtered = accounts;
        
        // Group Filtering
        const groupCondition = getGroupFilter(activeTab);
        filtered = filtered.filter(a => groupCondition(a.code));

        // Search text Filtering (keeps parent tree intuitively if needed, but simple filtering is easier: show matching nodes and their parents)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchingCodes = new Set<string>();
            filtered.forEach(a => {
                if (a.code.toLowerCase().includes(term) || a.name.toLowerCase().includes(term)) {
                    matchingCodes.add(a.code);
                    // Add all parents
                    let currentParent = a.parentCode;
                    while (currentParent) {
                        matchingCodes.add(currentParent);
                        currentParent = accounts.find(ax => ax.code === currentParent)?.parentCode || null;
                    }
                }
            });
            filtered = accounts.filter(a => matchingCodes.has(a.code));
        }

        return buildTree(filtered);
    }, [accounts, searchTerm, activeTab]);

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
                fetchAccounts();
            } else {
                showError('Hata', data.error || 'Hesap oluşturulamadı.');
            }
        } catch (error) {
            showError('Hata', 'Sunucu hatası.');
        }
    };

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
            
            {/* Header Redesign */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-sm p-6 overflow-hidden flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
                            <Network className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                Dinamik Hesap Ağacı
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                                TDHP yapısını zengin görünüm, gelir/gider hiyerarşisi ve gerçek zamanlı bakiyelerle yönetin.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button onClick={handleSync} disabled={syncing} className={`h-[44px] px-5 rounded-xl font-bold text-[13px] text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 flex items-center gap-2 transition-all shadow-sm ${syncing ? 'opacity-50 pointer-events-none' : ''}`}>
                            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">{syncing ? 'Senkronize...' : 'Veri Eşitle'}</span>
                        </button>
                        <button onClick={() => { setNewAccount({ code: '', name: '', parentCode: '', type: 'Borç' }); setShowAddModal(true); }} className="h-[44px] px-5 rounded-xl font-bold text-[13px] text-white shadow-md bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 flex items-center gap-2 transition-all">
                            <Plus className="w-4 h-4" /> Yeni Hesap Ekle
                        </button>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-2">
                    {[
                        { id: 'all', icon: <Folder className="w-4 h-4"/>, label: 'Tüm Hesaplar' },
                        { id: 'assets', icon: <Wallet className="w-4 h-4"/>, label: 'Varlıklar (100-299)' },
                        { id: 'liabilities', icon: <Landmark className="w-4 h-4"/>, label: 'Kaynaklar (300-599)' },
                        { id: 'income_expense', icon: <TrendingUp className="w-4 h-4"/>, label: 'Gelir / Gider (600+)' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center justify-center gap-2 h-12 rounded-xl text-[13px] font-bold transition-all border
                            ${activeTab === tab.id 
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 shadow-sm' 
                                : 'bg-transparent border-slate-200 dark:border-white/5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="mt-4 relative group">
                    <Search className="w-5 h-5 absolute left-4 top-[14px] text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Hesap kodu veya adı ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/5 rounded-[14px] px-4 py-3 text-[13px] font-bold h-[48px] pl-11 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                    />
                </div>
            </div>

            {/* Tree Container */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-sm flex flex-col min-h-[500px]">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-[11px]">
                        Ağaç Yükleniyor...
                    </div>
                ) : filteredAccounts.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12">
                        <Folder className="w-12 h-12 mb-4 opacity-50" />
                        <span className="font-bold uppercase tracking-widest text-[12px]">Sonuç Bulunamadı</span>
                    </div>
                ) : (
                    <div className="w-full flex-1 p-2">
                        {filteredAccounts.map(rootNode => (
                            <AccountTreeNode 
                                key={rootNode.id} 
                                account={rootNode} 
                                searchTerm={searchTerm}
                                onAddSubAccount={acc => {
                                    setNewAccount({ code: acc.code + '.', name: '', parentCode: acc.code, type: acc.type });
                                    setShowAddModal(true);
                                }}
                                onOpenLedger={setSelectedAccount}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[32px] w-full max-w-md p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-black mb-6">
                            {newAccount.parentCode ? `Alt Hesap Ekle (${newAccount.parentCode})` : 'Yeni Ana Hesap'}
                        </h3>
                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] font-bold tracking-widest text-slate-500 block mb-2 uppercase">HESAP KODU</label>
                                <input type="text" className="w-full bg-slate-50 dark:bg-[#1e293b]/50 border-none rounded-[16px] p-4 text-[14px] font-bold focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white" value={newAccount.code} onChange={e => setNewAccount({ ...newAccount, code: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold tracking-widest text-slate-500 block mb-2 uppercase">HESAP ADI</label>
                                <input type="text" className="w-full bg-slate-50 dark:bg-[#1e293b]/50 border-none rounded-[16px] p-4 text-[14px] font-bold focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white" value={newAccount.name} onChange={e => setNewAccount({ ...newAccount, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold tracking-widest text-slate-500 block mb-2 uppercase">HESAP TİPİ</label>
                                <select className="w-full bg-slate-50 dark:bg-[#1e293b]/50 border-none rounded-[16px] p-4 text-[14px] font-bold focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white" value={newAccount.type} onChange={e => setNewAccount({ ...newAccount, type: e.target.value })} disabled={!!newAccount.parentCode}>
                                    <option value="Borç">Borç (Aktif/Gider)</option>
                                    <option value="Alacak">Alacak (Pasif/Gelir)</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setShowAddModal(false)} className="flex-1 h-[56px] rounded-[16px] bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 text-slate-900 dark:text-white font-bold transition-colors">İptal</button>
                            <button onClick={handleAddAccount} className="flex-1 h-[56px] rounded-[16px] bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-lg shadow-blue-500/20">Kaydet</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedAccount && (
                <LedgerDetailModal isOpen={true} onClose={() => setSelectedAccount(null)} account={selectedAccount} />
            )}
        </div>
    );
}
