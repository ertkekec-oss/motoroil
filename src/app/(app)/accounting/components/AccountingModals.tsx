import React, { useState } from 'react';
import { useFinancials } from '@/contexts/FinancialContext';
import { useModal } from '@/contexts/ModalContext';
import { useCRM } from '@/contexts/CRMContext'; // Added useCRM

export default function AccountingModals({
    isOpen,
    onClose,
    type, // 'transaction', 'debt', 'collection', 'check', 'account', 'statement'
    posTheme
}: {
    isOpen: boolean;
    onClose: () => void;
    type: string;
    posTheme: 'dark' | 'light';
}) {
    const { addFinancialTransaction, addCheck, refreshKasalar, kasalar } = useFinancials();
    const { customers, suppliers } = useCRM(); // Get CRM data
    const { showSuccess, showError } = useModal();
    const [loading, setLoading] = useState(false);

    // Form States
    const [formData, setFormData] = useState<any>({
        type: type === 'debt' ? 'Payment' : type === 'collection' ? 'Collection' : 'Expense', // Default
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        kasaId: '',
        category: '',
        // Check specific
        dueDate: '',
        bankName: '',
        checkNo: '',
        // Account specific
        accountName: '',
        accountType: 'cash', // cash, bank
        currency: 'TRY',
        // CRM Relations
        customerId: '',
        supplierId: ''
    });

    // Statement Import State
    const [file, setFile] = useState<File | null>(null);
    const [selectedIban, setSelectedIban] = useState('');
    const [parsedTransactions, setParsedTransactions] = useState<any[]>([]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let res;
            if (type === 'transaction' || type === 'debt' || type === 'collection' || type === 'expense') {
                // Adjust type based on modal context
                const txType = type === 'debt' ? 'Payment' : type === 'collection' ? 'Collection' : formData.type;

                // Prepare Data
                const payload = {
                    ...formData,
                    type: txType,
                    amount: Number(formData.amount)
                };

                // Clear unused relations based on type
                if (type === 'collection') payload.supplierId = undefined; // Income usually from customer
                if (type === 'debt') payload.customerId = undefined; // Expense usually to supplier (or general)

                res = await addFinancialTransaction(payload);
            } else if (type === 'check') {
                const checkType = formData.type === 'In' ? 'In' : 'Out';

                const payload = {
                    ...formData,
                    type: checkType, // In = Alacak Çeki, Out = Borç Çeki
                    amount: Number(formData.amount)
                };

                // Relation Cleanup
                if (checkType === 'In') payload.supplierId = undefined;
                if (checkType === 'Out') payload.customerId = undefined;

                res = await addCheck(payload);
            } else if (type === 'account') {
                // Manually call API since context doesn't have addAccount
                const response = await fetch('/api/kasalar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formData.accountName,
                        type: formData.accountType,
                        currency: formData.currency,
                        balance: Number(formData.amount || 0) // Opening balance
                    })
                });
                res = await response.json();
                if (res.success) await refreshKasalar();
            }

            if (res?.success) {
                showSuccess('İşlem Başarılı', 'Kayıt başarıyla oluşturuldu.');
                onClose();
            } else {
                showError('Hata', res?.error || 'Bir hata oluştu.');
            }
        } catch (error) {
            showError('Hata', 'İşlem sırasında bir sorun oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);

        const data = new FormData();
        data.append('file', f);

        setLoading(true);
        try {
            if (f.name.toLowerCase().endsWith('.xml')) {
                if (!selectedIban) {
                    showError('Hata', 'Lütfen XML ithalatı için bir IBAN seçiniz.');
                    setLoading(false);
                    return;
                }
                data.append('iban', selectedIban);
                const res = await fetch('/api/fintech/banking/import-xml', {
                    method: 'POST',
                    body: data
                });
                const result = await res.json();
                if (result.success) {
                    showSuccess('Başarılı', `${result.imported} işlem içeri aktarıldı.`);
                    refreshKasalar();
                    onClose();
                } else {
                    showError('Hata', result.error);
                }
            } else {
                // Original PDF Parsing
                const res = await fetch('/api/financials/statements/parse', { // Use verified endpoint
                    method: 'POST',
                    body: data
                });
                const result = await res.json();
                if (result.success) {
                    setParsedTransactions(result.transactions);
                } else {
                    showError('Hata', result.error);
                }
            }
        } catch (err) {
            showError('Hata', 'Dosya okunamadı.');
        } finally {
            setLoading(false);
        }
    };

    const handleImportTransaction = async (tx: any) => {
        // Import single transaction from parsed list
        setLoading(true);
        const res = await addFinancialTransaction({
            date: tx.date,
            description: tx.description,
            amount: Math.abs(tx.amount), // Ensure positive
            type: tx.amount > 0 ? 'Income' : 'Expense', // Check sign logic
            kasaId: kasalar[0]?.id // Default to first account or let user choose
        });
        setLoading(false);
        if (res.success) {
            // Remove from list
            setParsedTransactions(prev => prev.filter(t => t !== tx));
            showSuccess('Aktarıldı', 'Kayıt eklendi.');
        }
    };

    // Render based on type
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: posTheme === 'light' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                backdropFilter: 'blur(4px)'
            }}
            data-pos-theme={posTheme}
        >
            <div className={`card glass border border-white/10 p-6 rounded-3xl w-full max-w-lg relative animate-in zoom-in-95 transaction-modal max-h-[90vh] overflow-y-auto ${posTheme === 'light' ? 'bg-white' : 'bg-[#1a1a1a]'}`}>
                <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">✕</button>

                <h2 className={posTheme === 'light' ? "text-xl font-black text-pos mb-6" : "text-xl font-bold text-white mb-6"}>
                    {type === 'debt' && 'Ödeme Yap (Borç)'}
                    {type === 'collection' && 'Tahsilat Ekle'}
                    {type === 'check' && 'Çek / Senet Ekle'}
                    {type === 'account' && 'Yeni Hesap Ekle'}
                    {type === 'statement' && 'Ekstre Yükle'}
                    {type === 'expense' && 'Gider Ekle'}
                </h2>

                {type === 'statement' ? (
                    <div className="space-y-4">
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">İşlem Yapılacak IBAN (XML için zorunlu)</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-pos outline-none mb-4"
                                value={selectedIban}
                                onChange={e => setSelectedIban(e.target.value)}
                            >
                                <option value="">IBAN Seçiniz</option>
                                {kasalar.filter(k => k.type === 'bank').map(k => (
                                    <option key={k.id} value={k.iban}>{k.name} - {k.iban}</option>
                                ))}
                            </select>

                            <div className={`border-2 border-dashed ${posTheme === 'light' ? 'border-primary/20 bg-primary/5' : 'border-white/20 bg-white/5'} rounded-2xl p-8 text-center hover:border-primary transition-colors`}>
                                <input type="file" onChange={handleFileUpload} accept=".pdf,.xml" className="hidden" id="file-upload" />
                                <label htmlFor="file-upload" className="cursor-pointer block">
                                    <div className="text-4xl mb-2">📄</div>
                                    <div className={posTheme === 'light' ? "text-sm font-black text-pos" : "text-sm font-bold text-white"}>PDF veya XML Ekstre Yükle</div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Bankanızdan aldığınız PDF veya XML (BizimHesap) ekstrelerini buraya sürükleyin.</div>
                                </label>
                            </div>
                        </div>

                        {loading && <div className="text-center text-white/50 text-sm">İşleniyor...</div>}

                        {parsedTransactions.length > 0 && (
                            <div className="max-h-60 overflow-y-auto space-y-2 mt-4">
                                <h3 className="text-xs font-bold text-white/50 uppercase">Bulunan İşlemler ({parsedTransactions.length})</h3>
                                {parsedTransactions.map((tx, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                                        <div>
                                            <div className="text-sm font-bold text-white">{tx.description}</div>
                                            <div className="text-xs text-white/50">{tx.date}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {tx.amount} TL
                                            </div>
                                            <button onClick={() => handleImportTransaction(tx)} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white">
                                                Ekle
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* CUSTOMER / SUPPLIER SELECTION LOGIC */}
                        {type === 'collection' && (
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Kimden Tahsilat Yapılacak?</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-pos outline-none focus:border-primary/50"
                                    value={formData.customerId}
                                    onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                                >
                                    <option value="">Seçiniz (Cari Yok)</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {type === 'debt' && (
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Kime Ödeme Yapılacak?</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-pos outline-none focus:border-primary/50"
                                    value={formData.supplierId}
                                    onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                                >
                                    <option value="">Seçiniz (Cari Yok / Genel Gider)</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {type === 'check' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Çek Türü</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-pos outline-none focus:border-primary/50"
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value, customerId: '', supplierId: '' })}
                                        >
                                            <option value="In">Müşteri Çeki (Alacak)</option>
                                            <option value="Out">Firma Çeki (Borç)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Vade Tarihi</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-pos outline-none focus:border-primary/50"
                                            value={formData.dueDate}
                                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                {formData.type === 'In' ? (
                                    <div>
                                        <label className="block text-xs font-bold text-white/50 mb-1">Kimden Alındı (Müşteri)</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-blue-500/50"
                                            value={formData.customerId}
                                            onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                                        >
                                            <option value="">Seçiniz</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-bold text-white/50 mb-1">Kime Verildi (Tedarikçi)</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-blue-500/50"
                                            value={formData.supplierId}
                                            onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                                        >
                                            <option value="">Seçiniz</option>
                                            {suppliers.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        {type === 'account' ? (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-white/50 mb-1">Hesap İsmi</label>
                                    <input
                                        type="text" required
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-blue-500/50"
                                        placeholder="Örn: Garanti Bankası, Ana Kasa..."
                                        value={formData.accountName}
                                        onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-white/50 mb-1">Hesap Türü</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-blue-500/50"
                                            value={formData.accountType}
                                            onChange={e => setFormData({ ...formData, accountType: e.target.value })}
                                        >
                                            <option value="cash">Nakit Kasa</option>
                                            <option value="bank">Banka Hesabı</option>
                                            <option value="pos">POS Hesabı</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-white/50 mb-1">Para Birimi</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-blue-500/50"
                                            value={formData.currency}
                                            onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                        >
                                            <option value="TRY">Türk Lirası (₺)</option>
                                            <option value="USD">Dolar ($)</option>
                                            <option value="EUR">Euro (€)</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/50 mb-1">Açılış Bakiyesi</label>
                                    <input
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-blue-500/50 font-bold text-lg"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                {type !== 'check' && (
                                    <div>
                                        <label className="block text-xs font-bold text-white/50 mb-1">İşlem Tarihi</label>
                                        <input
                                            type="date" required
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-blue-500/50"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-white/50 mb-1">Açıklama</label>
                                    <input
                                        type="text" required
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-blue-500/50"
                                        placeholder="İşlem açıklaması giriniz..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-white/50 mb-1">Tutar (₺)</label>
                                    <input
                                        type="number" required
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-blue-500/50 font-bold text-2xl"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>

                                {type !== 'check' && (
                                    <div>
                                        <label className="block text-xs font-bold text-white/50 mb-1">İlgili Kasa / Hesap</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-blue-500/50"
                                            value={formData.kasaId}
                                            onChange={e => setFormData({ ...formData, kasaId: e.target.value })}
                                            required
                                        >
                                            <option value="">Seçiniz</option>
                                            {kasalar.map(k => (
                                                <option key={k.id} value={k.id}>{k.name} ({k.balance} ₺)</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full ${posTheme === 'light' ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-blue-600'} hover:opacity-90 text-white font-black py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50 mt-4 uppercase tracking-widest text-xs`}
                        >
                            {loading ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
