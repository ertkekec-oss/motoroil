"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function NewReconciliationPage() {
    const [accountId, setAccountId] = useState('');
    const [customers, setCustomers] = useState<{ id: string, name: string }[]>([]);
    const [type, setType] = useState('CURRENT_ACCOUNT');
    const [periodEnd, setPeriodEnd] = useState('');
    const [totalDebit, setTotalDebit] = useState(0);
    const [totalCredit, setTotalCredit] = useState(0);
    const [balanceRaw, setBalanceRaw] = useState(0);
    const [counterpartyEmail, setCounterpartyEmail] = useState('');
    const [counterpartyName, setCounterpartyName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch('/api/customers').then(r => r.json()).then(data => {
            if (data.success && data.customers?.length > 0) {
                setCustomers(data.customers);
                setAccountId(data.customers[0].id);
            }
        }).catch(err => console.error(err));
    }, []);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/reconciliation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountId,
                    type,
                    periodEnd,
                    totalDebit,
                    totalCredit,
                    balanceRaw,
                    currency: 'TRY',
                    counterpartyEmail,
                    counterpartyName
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('Mutabakat başarıyla oluşturuldu ve gönderildi.');
                window.location.href = `/reconciliation/${data.reconciliation.id}`;
            } else {
                alert(data.error || 'Mutabakat oluşturulamadı.');
            }
        } catch (error) {
            alert('Ağ hatası.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <Link href="/reconciliation/list" style={{ color: '#888', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '24px' }} className="hover:text-blue-500">
                    <span style={{ fontSize: '16px' }}>←</span> Mutabakat Listesine Dön
                </Link>
                <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                    Yeni Mutabakat Gönder
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>
                    Cari veya BA/BS mutabakatı için manuel kayıt oluşturun. (Normalde ERP'den otomatik gelir).
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', background: 'var(--bg-card, rgba(255,255,255,0.02))', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>İlgili Cari / Firma Seçimi</label>
                            <select required value={accountId} onChange={e => setAccountId(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontSize: '14px' }}>
                                <option value="" disabled style={{ color: 'black' }}>Lütfen Cari Seçiniz...</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id} style={{ color: 'black' }}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>Mutabakat Tipi</label>
                            <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontSize: '14px' }}>
                                <option value="CURRENT_ACCOUNT" style={{ color: 'black' }}>Cari Hesap (Bakiye) Mutabakatı</option>
                                <option value="FORM_BA" style={{ color: 'black' }}>Form BA</option>
                                <option value="FORM_BS" style={{ color: 'black' }}>Form BS</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>Dönem Sonu Tarihi</label>
                            <input required type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontSize: '14px', colorScheme: 'dark' }} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>Toplam Borç</label>
                            <input required type="number" step="0.01" value={totalDebit} onChange={e => setTotalDebit(parseFloat(e.target.value))} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontSize: '14px' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>Toplam Alacak</label>
                            <input required type="number" step="0.01" value={totalCredit} onChange={e => setTotalCredit(parseFloat(e.target.value))} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontSize: '14px' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>Net Bakiye (Bizim Kayıtlara Göre)</label>
                            <input required type="number" step="0.01" value={balanceRaw} onChange={e => setBalanceRaw(parseFloat(e.target.value))} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontWeight: 'bold', fontSize: '14px' }} />
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)', margin: '16px 0' }} />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>Karşı Firma (Yetkili E-Posta)</label>
                            <input required type="email" value={counterpartyEmail} onChange={e => setCounterpartyEmail(e.target.value)} placeholder="ornek@firma.com" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontSize: '14px' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>Karşı Taraf (Kişi/Firma Adı)</label>
                            <input required type="text" value={counterpartyName} onChange={e => setCounterpartyName(e.target.value)} placeholder="Firma A.Ş." style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontSize: '14px' }} />
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', marginTop: '16px' }}>
                        <button disabled={loading} type="submit" style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', borderRadius: '10px', border: 'none', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }} className="hover:bg-blue-600 disabled:opacity-50">
                            {loading ? 'Gönderiliyor...' : 'Oluştur ve Gönder'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
