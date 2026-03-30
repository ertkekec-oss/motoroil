const fs = require('fs');

const code = `import React, { useState } from 'react';
import { useFinancials } from '@/contexts/FinancialContext';
import { useModal } from '@/contexts/ModalContext';
import { useCRM } from '@/contexts/CRMContext';
import { X, FileText, UploadCloud, CheckCircle2, Building2, UserCircle, Settings2, Target, Users } from 'lucide-react';

export default function AccountingModals({
    isOpen,
    onClose,
    type,
    theme
}: {
    isOpen: boolean;
    onClose: () => void;
    type: string;
    theme?: 'dark' | 'light';
}) {
    const { addFinancialTransaction, addCheck, refreshKasalar, kasalar } = useFinancials();
    const { customers, suppliers } = useCRM();
    const { showSuccess, showError } = useModal();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<any>({
        type: type === 'debt' ? 'Payment' : type === 'collection' ? 'Collection' : 'Expense',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        kasaId: '',
        category: '',
        dueDate: '',
        bank: '',
        number: '',
        accountName: '',
        accountType: 'cash',
        currency: 'TRY',
        customerId: '',
        supplierId: '',
        targetKasaId: ''
    });

    const [file, setFile] = useState<File | null>(null);
    const [selectedIban, setSelectedIban] = useState('');
    const [parsedTransactions, setParsedTransactions] = useState<any[]>([]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let res;
            if (['transaction', 'debt', 'collection', 'expense', 'transfer'].includes(type)) {
                const txType = type === 'debt' ? 'Payment' : type === 'collection' ? 'Collection' : type === 'transfer' ? 'Transfer' : formData.type;
                const payload = {
                    ...formData,
                    type: txType,
                    amount: Math.abs(Number(formData.amount))
                };

                if (type === 'collection') payload.supplierId = undefined;
                if (type === 'debt') payload.customerId = undefined;
                if (type === 'transfer') {
                    payload.customerId = undefined;
                    payload.supplierId = undefined;
                    if (payload.kasaId === payload.targetKasaId) {
                        return showError('Hata', 'Çıkış kasası ile hedef kasa aynı olamaz.');
                    }
                }

                res = await addFinancialTransaction(payload);
            } else if (type === 'check') {
                const checkType = formData.type === 'In' ? 'In' : 'Out';
                const payload = {
                    ...formData,
                    type: checkType,
                    amount: Number(formData.amount)
                };

                if (checkType === 'In') payload.supplierId = undefined;
                if (checkType === 'Out') payload.customerId = undefined;

                res = await addCheck(payload);
            } else if (type === 'account') {
                const response = await fetch('/api/kasalar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formData.accountName,
                        type: formData.accountType,
                        currency: formData.currency,
                        balance: Number(formData.amount || 0)
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
                    showSuccess('Başarılı', \`\${result.imported} işlem içeri aktarıldı.\`);
                    refreshKasalar();
                    onClose();
                } else {
                    showError('Hata', result.error);
                }
            } else {
                const res = await fetch('/api/financials/statements/parse', {
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
        setLoading(true);
        const res = await addFinancialTransaction({
            date: tx.date,
            description: tx.description,
            amount: Math.abs(tx.amount),
            type: tx.amount > 0 ? 'Income' : 'Expense',
            kasaId: kasalar[0]?.id
        });
        setLoading(false);
        if (res.success) {
            setParsedTransactions(prev => prev.filter(t => t !== tx));
            showSuccess('Aktarıldı', 'Kayıt eklendi.');
        }
    };

    const inputClasses = "w-full bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors";
    const labelClasses = "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5";

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }} className="flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-2xl w-full max-w-lg relative animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col overflow-hidden">
                
                {/* Header Container */}
                <div className="bg-[#f8fafc] dark:bg-[#1e293b]/50 border-b border-slate-200 dark:border-white/5 px-6 py-5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            {type === 'debt' && <Target className="w-5 h-5"/>}
                            {type === 'collection' && <Target className="w-5 h-5"/>}
                            {type === 'check' && <FileText className="w-5 h-5"/>}
                            {type === 'account' && <Building2 className="w-5 h-5"/>}
                            {type === 'statement' && <UploadCloud className="w-5 h-5"/>}
                            {type === 'expense' && <Settings2 className="w-5 h-5"/>}
                            {type === 'transfer' && <Settings2 className="w-5 h-5"/>}
                        </div>
                        <div>
                            <h2 className="text-[16px] font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1">
                                {type === 'debt' && 'Ödeme Yap (Borç)'}
                                {type === 'collection' && 'Tahsilat Ekle'}
                                {type === 'check' && 'Çek / Senet Formu'}
                                {type === 'account' && 'Yeni Kasa / Banka Hesabı'}
                                {type === 'statement' && 'Dijital Ekstre Yükle'}
                                {type === 'expense' && 'Gider Gir'}
                                {type === 'transfer' && 'Kasalar Arası Transfer'}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                İşlem Formu
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form Body Container */}
                <div className="p-6 overflow-y-auto w-full">
                    {type === 'statement' ? (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className={labelClasses}>İşlem Yapılacak IBAN (XML Tipi Zorunlu)</label>
                                    <select className={inputClasses} value={selectedIban} onChange={e => setSelectedIban(e.target.value)}>
                                        <option value="">IBAN Seçiniz</option>
                                        {kasalar.filter(k => k.type === 'bank').map(k => (
                                            <option key={k.id} value={k.iban}>{k.name} - {k.iban}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl p-8 text-center hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-colors group cursor-pointer relative overflow-hidden">
                                    <input type="file" onChange={handleFileUpload} accept=".pdf,.xml" className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" id="file-upload" />
                                    <UploadCloud className="w-8 h-8 text-indigo-400 dark:text-indigo-500 mx-auto mb-3 group-hover:scale-110 transition-transform"/>
                                    <div className="text-[14px] font-black text-indigo-600 dark:text-indigo-400 mb-1">PDF veya XML Ekstre Yükle</div>
                                    <div className="text-[10px] font-bold text-indigo-600/60 dark:text-indigo-400/60 uppercase tracking-widest max-w-[250px] mx-auto">Bankanızdan aldığınız ekstreleri kutuya sürükleyin veya tıklayın.</div>
                                </div>
                            </div>

                            {loading && <div className="flex items-center justify-center gap-2 py-4">
                                <div className="animate-spin w-4 h-4 rounded-full border-2 border-r-indigo-600 border-indigo-100"></div>
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">İşleniyor...</span>
                            </div>}

                            {parsedTransactions.length > 0 && (
                                <div className="space-y-3 mt-4">
                                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Bulunan İşlemler ({parsedTransactions.length})</h3>
                                    <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
                                        {parsedTransactions.map((tx, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-[#1e293b]/50 rounded-xl border border-slate-200 dark:border-white/5">
                                                <div>
                                                    <div className="text-[12px] font-black text-slate-800 dark:text-white truncate max-w-[150px]">{tx.description}</div>
                                                    <div className="text-[10px] font-medium text-slate-500">{tx.date}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className={\`text-[13px] font-black \${tx.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}\`}>
                                                        {tx.amount} TL
                                                    </div>
                                                    <button onClick={() => handleImportTransaction(tx)} className="px-3 py-1.5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-800 dark:text-white text-[10px] font-black uppercase tracking-widest transition-all">
                                                        Ekle
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {type === 'collection' && (
                                <div>
                                    <label className={labelClasses}>Kimden Tahsilat Yapılacak?</label>
                                    <select className={inputClasses} value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })}>
                                        <option value="">Seçiniz (Cari Yok)</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {type === 'debt' && (
                                <div>
                                    <label className={labelClasses}>Kime Ödeme Yapılacak?</label>
                                    <select className={inputClasses} value={formData.supplierId} onChange={e => setFormData({ ...formData, supplierId: e.target.value })}>
                                        <option value="">Seçiniz (Genel Gider / Cari Yok)</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {type === 'check' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClasses}>Çek Türü</label>
                                            <select className={inputClasses} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value, customerId: '', supplierId: '' })}>
                                                <option value="In">Müşteri Çeki (Alacak)</option>
                                                <option value="Out">Firma Çeki (Borç)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Vade Tarihi</label>
                                            <input type="date" required className={inputClasses} value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })}/>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClasses}>Banka Adı</label>
                                            <input type="text" required placeholder="Örn: Garanti" className={inputClasses} value={formData.bank} onChange={e => setFormData({ ...formData, bank: e.target.value })}/>
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Çek / Senet No</label>
                                            <input type="text" required placeholder="Seri / Belge No" className={inputClasses} value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })}/>
                                        </div>
                                    </div>
                                    {formData.type === 'In' ? (
                                        <div>
                                            <label className={labelClasses}>Kimden Alındı (Müşteri)</label>
                                            <select className={inputClasses} value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })}>
                                                <option value="">Seçiniz</option>
                                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className={labelClasses}>Kime Verildi (Tedarikçi)</label>
                                            <select className={inputClasses} value={formData.supplierId} onChange={e => setFormData({ ...formData, supplierId: e.target.value })}>
                                                <option value="">Seçiniz</option>
                                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                            {type === 'account' ? (
                                <>
                                    <div>
                                        <label className={labelClasses}>Kasa / Hesap İsmi</label>
                                        <input type="text" required className={inputClasses} placeholder="Örn: Garanti Bankası, Ana Kasa..." value={formData.accountName} onChange={e => setFormData({ ...formData, accountName: e.target.value })}/>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClasses}>Hesap Türü</label>
                                            <select className={inputClasses} value={formData.accountType} onChange={e => setFormData({ ...formData, accountType: e.target.value })}>
                                                <option value="cash">Nakit Kasa</option>
                                                <option value="bank">Banka Hesabı</option>
                                                <option value="pos">POS Hesabı</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Para Birimi</label>
                                            <select className={inputClasses} value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                                                <option value="TRY">Türk Lirası (₺)</option>
                                                <option value="USD">Dolar ($)</option>
                                                <option value="EUR">Euro (€)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Açılış Bakiyesi (TL)</label>
                                        <input type="number" className={\`\${inputClasses} text-lg font-black\`} placeholder="0.00" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })}/>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {type !== 'check' && (
                                        <div>
                                            <label className={labelClasses}>İşlem Tarihi</label>
                                            <input type="date" required className={inputClasses} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}/>
                                        </div>
                                    )}

                                    <div>
                                        <label className={labelClasses}>Açıklama</label>
                                        <input type="text" required className={inputClasses} placeholder="İşlem açıklaması giriniz..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}/>
                                    </div>

                                    <div>
                                        <label className={labelClasses}>Tutar {formData.currency ? \`(\${formData.currency})\` : '(TL)'}</label>
                                        <input type="number" required className={\`\${inputClasses} text-2xl font-black py-4\`} placeholder="0.00" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })}/>
                                    </div>

                                    {type !== 'check' && (
                                        <div>
                                            <label className={labelClasses}>İşlem Yapılacak Kasa / Hesap</label>
                                            <select className={inputClasses} value={formData.kasaId} onChange={e => setFormData({ ...formData, kasaId: e.target.value })} required>
                                                <option value="">Seçiniz</option>
                                                {kasalar.map(k => <option key={k.id} value={k.id}>{k.name} ({k.balance} ₺)</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {type === 'transfer' && (
                                        <div>
                                            <label className={labelClasses}>Hedef Kasa / Alıcı Hesap</label>
                                            <select className={inputClasses} value={formData.targetKasaId} onChange={e => setFormData({ ...formData, targetKasaId: e.target.value })} required>
                                                <option value="">Hedef Kasa Seçiniz</option>
                                                {kasalar.map(k => <option key={k.id} value={k.id}>{k.name} ({k.balance} ₺)</option>)}
                                            </select>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="pt-4">
                                <button type="submit" disabled={loading} className={\`w-full h-12 \${loading ? 'opacity-50 cursor-not-allowed' : ''} bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]\`}>
                                    {loading ? 'KAYDEDİLİYOR...' : 'ONAYLA VE KAYDET'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}`;

fs.writeFileSync('src/app/(app)/accounting/components/AccountingModals.tsx', code);
console.log('done rewriting accounting modals');
