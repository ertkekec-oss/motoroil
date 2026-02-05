"use client";
import React, { useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface StatementModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    entity: {
        name: string;
        phone?: string;
        email?: string;
        address?: string;
        taxNumber?: string;
        taxOffice?: string;
        balance?: number;
    };
    transactions: any[];
    type: 'summary' | 'detailed';
    entityType?: 'CUSTOMER' | 'SUPPLIER';
}

export default function StatementModal({ isOpen, onClose, title, entity, transactions, type, entityType = 'CUSTOMER' }: StatementModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const { processedTransactions, totals } = useMemo(() => {
        try {
            if (!transactions || !Array.isArray(transactions)) {
                return { processedTransactions: [], totals: { totalDebt: 0, totalCredit: 0, balance: entity.balance || 0 } };
            }

            const isCustomer = entityType === 'CUSTOMER';
            const sorted = [...transactions].sort((a, b) => {
                const dA = new Date(a?.rawDate || a?.date || 0).getTime();
                const dB = new Date(b?.rawDate || b?.date || 0).getTime();
                return (isNaN(dA) ? 0 : dA) - (isNaN(dB) ? 0 : dB);
            });

            // Step 1: Mapped all transactions to Debt/Credit
            let totalProcessedDebt = 0;
            let totalProcessedCredit = 0;
            const mapped = sorted.map(t => {
                let debt = 0;
                let credit = 0;
                const tType = t?.type || '';
                const amount = Number(t?.amount) || 0;

                if (isCustomer) {
                    // For Customer: Debt (Sales/Invoices) increases their debt to us. Credit (Collections/Payments) decreases it.
                    if (['Fatura', 'Satış', 'Gider', 'Sales', 'Borç'].some(k => tType.includes(k))) debt = Math.abs(amount);
                    else credit = Math.abs(amount);
                } else {
                    // For Supplier: Debt (Payments/Refunds) decreases our debt to them. Credit (Purchases/Invoices) increases it.
                    if (['Ödeme', 'Tahsilat', 'Payment', 'Giriş'].some(k => tType.includes(k))) debt = Math.abs(amount);
                    else credit = Math.abs(amount);
                }
                totalProcessedDebt += debt;
                totalProcessedCredit += credit;
                return { ...t, debt, credit };
            });

            // Step 2: Handle Opening Balance if current total doesn't match entity balance
            const currentBalanceInEntity = Number(entity.balance) || 0;
            // Balance = Opening + (Debt - Credit)  => Opening = Balance - (Debt - Credit)
            // This applies to "Asset" orientation where Positive means they owe us.
            const netProcessed = totalProcessedDebt - totalProcessedCredit;
            const openingBalance = currentBalanceInEntity - netProcessed;

            const finalProcessed = [];
            let totalDebt = 0;
            let totalCredit = 0;
            let rb = openingBalance;

            if (Math.abs(openingBalance) > 0.01) {
                totalDebt += (openingBalance > 0 ? openingBalance : 0);
                totalCredit += (openingBalance < 0 ? Math.abs(openingBalance) : 0);
                finalProcessed.push({
                    date: '—',
                    type: 'Devir',
                    desc: 'Dönem Başı Devreden Bakiye',
                    debt: openingBalance > 0 ? openingBalance : 0,
                    credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
                    balance: openingBalance
                });
            }

            mapped.forEach(t => {
                rb += (t.debt - t.credit);
                totalDebt += t.debt;
                totalCredit += t.credit;
                finalProcessed.push({ ...t, balance: rb });
            });

            if (type === 'summary') {
                const groups: Record<string, any> = {};
                // Include opening balance as its own group in summary
                if (Math.abs(openingBalance) > 0.01) {
                    groups['Devir'] = { date: '—', type: 'Devir', desc: 'Dönem Başı Devreden Bakiye', debt: openingBalance > 0 ? openingBalance : 0, credit: openingBalance < 0 ? Math.abs(openingBalance) : 0, balance: 0 };
                }

                mapped.forEach(t => {
                    const key = t.type;
                    if (!groups[key]) {
                        groups[key] = { date: '—', type: t.type, desc: `${t.type} İşlemleri Toplamı`, debt: 0, credit: 0, balance: 0 };
                    }
                    groups[key].debt += t.debt;
                    groups[key].credit += t.credit;
                });

                let summaryRb = 0;
                const summarized = Object.values(groups).map(g => {
                    summaryRb += (g.debt - g.credit);
                    return { ...g, balance: summaryRb };
                });
                return { processedTransactions: summarized, totals: { totalDebt, totalCredit, balance: rb } };
            }

            return { processedTransactions: finalProcessed, totals: { totalDebt, totalCredit, balance: rb } };
        } catch (e) {
            console.error('Statement Calculation Error:', e);
            return { processedTransactions: [], totals: { totalDebt: 0, totalCredit: 0, balance: 0 } };
        }
    }, [transactions, entityType, entity, type]);

    function allProcessedHistory(processed: any[], groups: any) {
        processed.forEach(t => {
            const key = t.type;
            if (!groups[key]) {
                groups[key] = { date: '—', type: t.type, desc: `${t.type} İşlemleri Toplamı`, debt: 0, credit: 0, balance: 0 };
            }
            groups[key].debt += t.debt;
            groups[key].credit += t.credit;
        });
    }

    const handlePrint = () => {
        window.print();
    };

    if (!isOpen || !mounted) return null;

    const modalLayout = (
        <div
            className="statement-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="statement-modal-container no-print">
                {/* TOOLBAR */}
                <div className="statement-toolbar">
                    <div className="toolbar-info">
                        <div className="toolbar-icon">📄</div>
                        <div>
                            <div className="toolbar-title">{title}</div>
                            <div className="toolbar-subtitle">BELGE ÖNİZLEME</div>
                        </div>
                    </div>
                    <div className="toolbar-actions">
                        <button onClick={handlePrint} className="print-btn">
                            <span>🖨️</span> Yazdır / PDF Olarak Kaydet
                        </button>
                        <button onClick={onClose} className="close-btn">×</button>
                    </div>
                </div>

                {/* PAPER DOCUMENT */}
                <div className="document-scroller">
                    <div className="paper-document" id="printable-area">
                        {/* Header */}
                        <div className="doc-header">
                            <div className="brand-section">
                                <div className="brand-logo">P</div>
                                <div>
                                    <div className="brand-name">PERIODYA</div>
                                    <div className="doc-type-label">{entityType === 'CUSTOMER' ? 'MÜŞTERİ HESAP EKSTRESİ' : 'TEDARİKÇİ HESAP EKSTRESİ'}</div>
                                </div>
                            </div>
                            <div className="doc-meta">
                                <div className="meta-item">
                                    <span className="meta-label">DÜZENLEME TARİHİ</span>
                                    <span className="meta-value">{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">BELGE NO</span>
                                    <span className="meta-value">#{Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Parties */}
                        <div className="parties-grid">
                            <div className="party-box">
                                <div className="party-label">HESAP SAHİBİ</div>
                                <div className="party-name">{entity.name}</div>
                                <div className="party-details">
                                    {entity.address || 'Adres bilgisi girilmemiş'}<br />
                                    {entity.phone || 'Telefon bilgisi yok'}<br />
                                    {entity.taxNumber ? `VKN: ${entity.taxNumber}` : ''}
                                </div>
                            </div>
                            <div className="party-box text-right">
                                <div className="party-label">DÜZENLEYEN</div>
                                <div className="party-name">PERIODYA GARAJ</div>
                                <div className="party-details">
                                    Merkez Mahallesi, Sanayi Sokak<br />
                                    No: 124, Kadıköy / İstanbul<br />
                                    0212 999 11 11
                                </div>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="summary-section">
                            <div className="summary-card">
                                <div className="card-label">TOPLAM BORÇ</div>
                                <div className="card-value debt">₺{totals.totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            </div>
                            <div className="summary-card">
                                <div className="card-label">TOPLAM ALACAK</div>
                                <div className="card-value credit">₺{totals.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            </div>
                            <div className="summary-card highlight">
                                <div className="card-label">GÜNCEL BAKİYE</div>
                                <div className="card-value">₺{Math.abs(totals.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                <div className="card-status">{totals.balance > 0 ? 'BORÇLU' : totals.balance < 0 ? 'ALACAKLI' : 'DENGELİ'}</div>
                            </div>
                        </div>

                        {/* Table */}
                        <table className="doc-table">
                            <thead>
                                <tr>
                                    <th>TARİH</th>
                                    <th>İŞLEM AÇIKLAMASI</th>
                                    <th className="text-right">BORÇ</th>
                                    <th className="text-right">ALACAK</th>
                                    <th className="text-right highlight">BAKİYE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedTransactions.map((t: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="date-cell">{t.date}</td>
                                        <td>
                                            <div className="item-desc">{t.desc || t.type}</div>
                                            <div className="item-type">{t.type}</div>
                                        </td>
                                        <td className="text-right debt-cell">{t.debt > 0 ? t.debt.toLocaleString() : '—'}</td>
                                        <td className="text-right credit-cell">{t.credit > 0 ? t.credit.toLocaleString() : '—'}</td>
                                        <td className="text-right balance-cell">₺{Math.abs(t.balance).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={2} className="text-right total-label">GENEL TOPLAM</td>
                                    <td className="text-right total-debt">₺{totals.totalDebt.toLocaleString()}</td>
                                    <td className="text-right total-credit">₺{totals.totalCredit.toLocaleString()}</td>
                                    <td className="text-right total-balance">₺{Math.abs(totals.balance).toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>

                        {/* Footer */}
                        <div className="doc-footer">
                            <div className="footer-notes">
                                <strong>NOTLAR:</strong><br />
                                * Bu belge sistem üzerinden otomatik olarak üretilmiştir.<br />
                                * İtirazlar 7 iş günü içerisinde yazılı olarak yapılmalıdır.
                            </div>
                            <div className="footer-stamps">
                                <div className="stamp-box">TESLİM EDEN</div>
                                <div className="stamp-box">TESLİM ALAN</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .statement-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 999999;
                    padding: 20px;
                }
                .statement-modal-container {
                    width: 100%;
                    max-width: 1000px;
                    height: 95vh;
                    background: #111;
                    border-radius: 24px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.5);
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .statement-toolbar {
                    padding: 15px 25px;
                    background: #1a1a1a;
                    border-bottom: 1px solid #333;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .toolbar-info { display: flex; align-items: center; gap: 15px; }
                .toolbar-icon { font-size: 24px; }
                .toolbar-title { color: white; font-weight: bold; font-size: 16px; }
                .toolbar-subtitle { color: #666; font-size: 10px; font-weight: 800; letter-spacing: 2px; }
                
                .toolbar-actions { display: flex; align-items: center; gap: 15px; }
                .print-btn {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 12px;
                    font-weight: bold;
                    font-size: 13px;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .print-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4); }
                .close-btn {
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 32px;
                    line-height: 1;
                    cursor: pointer;
                    opacity: 0.5;
                }
                .close-btn:hover { opacity: 1; }

                .document-scroller {
                    flex: 1;
                    overflow-y: auto;
                    padding: 40px 0;
                    background: #0f1115; /* Daha derin, premium bir koyu gri */
                    display: block; /* Flexbox bazen uzun dökümanlarda taşma sorunu yapabilir */
                }
                .paper-document {
                    width: 95%;
                    max-width: 820px;
                    background: white;
                    color: #1a1a1a;
                    padding: 60px;
                    margin: 0 auto 40px auto; /* Merkeze al ve altta boşluk bırak */
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    min-height: 1160px; /* Yaklaşık A4 oranı */
                    height: auto;
                    display: flex;
                    flex-direction: column;
                    border-radius: 4px; /* Hafif kağıt köşesi */
                }

                .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px; border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; }
                .brand-section { display: flex; align-items: center; gap: 15px; }
                .brand-logo { width: 50px; height: 50px; background: #1a1a1a; color: white; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: black; border-radius: 12px; }
                .brand-name { font-size: 24px; font-weight: 900; letter-spacing: -1px; }
                .doc-type-label { color: #3b82f6; font-size: 12px; font-weight: 800; }
                
                .doc-meta { text-align: right; }
                .meta-item { margin-bottom: 5px; }
                .meta-label { font-size: 9px; color: #999; font-weight: bold; display: block; }
                .meta-value { font-size: 14px; font-weight: bold; }

                .parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 50px; }
                .party-label { font-size: 10px; font-weight: bold; color: #aaa; margin-bottom: 5px; }
                .party-name { font-size: 18px; font-weight: 800; margin-bottom: 8px; }
                .party-details { font-size: 12px; color: #666; line-height: 1.5; }
                .text-right { text-align: right; }

                .summary-section { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 40px; }
                .summary-card { padding: 20px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; }
                .summary-card.highlight { background: #1a1a1a; color: white; border: none; }
                .card-label { font-size: 9px; font-weight: bold; color: #94a3b8; margin-bottom: 5px; }
                .card-value { font-size: 18px; font-weight: 900; }
                .card-value.debt { color: #ef4444; }
                .card-value.credit { color: #10b981; }
                .card-status { font-size: 10px; font-weight: bold; color: #3b82f6; margin-top: 5px; }

                .doc-table { width: 100%; border-collapse: collapse; font-size: 12px; }
                .doc-table th { padding: 15px 10px; text-align: left; border-bottom: 2px solid #1a1a1a; font-weight: bold; }
                .doc-table td { padding: 15px 10px; border-bottom: 1px solid #eee; }
                .date-cell { color: #999; font-weight: medium; }
                .item-desc { font-weight: bold; font-size: 13px; }
                .item-type { font-size: 9px; color: #999; font-weight: bold; }
                .debt-cell { color: #ef4444; font-weight: bold; }
                .credit-cell { color: #10b981; font-weight: bold; }
                .balance-cell { font-weight: 900; background: #f8fafc; }
                .highlight { background: #f8fafc; }

                .doc-table tfoot td { padding: 20px 10px; font-weight: 900; font-size: 14px; }
                .total-label { color: #999; font-size: 11px; }
                .total-balance { background: #1a1a1a; color: white; }

                .doc-footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
                .footer-notes { font-size: 10px; color: #999; line-height: 1.6; }
                .footer-stamps { display: flex; gap: 30px; }
                .stamp-box { width: 140px; height: 100px; border: 1px dashed #ddd; border-radius: 12px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 10px; font-size: 10px; font-weight: bold; color: #ccc; }

                @media print {
                    @page { 
                        size: A4; 
                        margin: 1cm; /* Standart kenar boşluğu */
                    }
                    
                    /* Her şeyi gizle ama döküman içeriğini serbest bırak */
                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                    }

                    body * {
                        visibility: hidden;
                    }

                    /* Sadece belgeyi ve içindekileri görünür yap */
                    .statement-modal-overlay, 
                    .statement-modal-overlay *,
                    #printable-area,
                    #printable-area * {
                        visibility: visible;
                    }

                    /* Yazdırma esnasında overlay ve container yapılarını sıfırla */
                    .statement-modal-overlay {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        background: white !important;
                        backdrop-filter: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        display: block !important;
                    }

                    .statement-modal-container {
                        position: static !important;
                        width: 100% !important;
                        height: auto !important;
                        background: white !important;
                        border: none !important;
                        box-shadow: none !important;
                        display: block !important;
                    }

                    .document-scroller {
                        position: static !important;
                        height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        display: block !important;
                    }

                    .paper-document {
                        width: 100% !important;
                        max-width: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        height: auto !important;
                        min-height: 0 !important;
                    }

                    /* Yazdırılmayacak butonları tamamen yok et */
                    .no-print { 
                        display: none !important; 
                        height: 0 !important;
                        width: 0 !important;
                    }
                }
            `}</style>
        </div>
    );

    return createPortal(modalLayout, document.body);
}
