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

function DetailedGroupRow({ groupDate, items }: { groupDate: string, items: any[] }) {
    const [open, setOpen] = useState(true);

    // Group totals
    const gDebt = items.reduce((a, b) => a + b.debt, 0);
    const gCredit = items.reduce((a, b) => a + b.credit, 0);

    return (
        <>
            <tr style={{ background: 'rgba(248, 250, 252, 0.4)', borderBottom: open ? 'none' : '1px solid #eee' }} className="group-row">
                <td colSpan={5} style={{ padding: '8px 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
                            <span style={{ fontSize: '10px', color: '#94a3b8', transform: open ? 'rotate(90deg)' : 'rotate(0)', transition: '0.2s', display: 'inline-block' }}>▶</span>
                            <span style={{ fontWeight: '800', fontSize: '12px', color: '#475569', letterSpacing: '0.5px' }}>{groupDate}</span>
                            <span style={{ fontSize: '10px', background: '#e2e8f0', color: '#64748b', padding: '2px 6px', borderRadius: '12px', fontWeight: '800' }}>{items.length} İşlem</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', display: 'flex', gap: '16px' }}>
                            {gDebt > 0 && <span style={{ color: '#ef4444' }}>Toplam Borç: {gDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>}
                            {gCredit > 0 && <span style={{ color: '#10b981' }}>Toplam Alacak: {gCredit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>}
                        </div>
                    </div>
                </td>
            </tr>
            {open && items?.map((t, idx) => (
                <tr key={idx} style={{ background: '#fff' }}>
                    <td className="date-cell" style={{ paddingLeft: '32px' }}>{t.date}</td>
                    <td>
                        <div className="item-desc">{t.desc || t.type}</div>
                        <div className="item-type">{t.type}</div>
                    </td>
                    <td className="text-right debt-cell">{t.debt > 0 ? t.debt.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '—'}</td>
                    <td className="text-right credit-cell">{t.credit > 0 ? t.credit.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '—'}</td>
                    <td className="text-right balance-cell">₺{t.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                </tr>
            ))}
        </>
    );
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

    const { processedTransactions, totals, groupedDates } = useMemo(() => {
        try {
            if (!transactions || !Array.isArray(transactions)) {
                return { processedTransactions: [], totals: { totalDebt: 0, totalCredit: 0, balance: entity.balance || 0 }, groupedDates: {} };
            }

            const isCustomer = entityType === 'CUSTOMER';
            const sorted = [...transactions].sort((a, b) => {
                const dA = new Date(a?.rawDate || a?.date || 0).getTime();
                const dB = new Date(b?.rawDate || b?.date || 0).getTime();
                return (isNaN(dA) ? 0 : dA) - (isNaN(dB) ? 0 : dB);
            });

            let totalProcessedDebt = 0;
            let totalProcessedCredit = 0;
            const mapped = sorted?.map(t => {
                let debt = 0;
                let credit = 0;
                const tType = t?.type || '';
                const amount = Number(t?.amount) || 0;

                if (isCustomer) {
                    if (['Fatura', 'Satış', 'Gider', 'Sales', 'Borç'].some(k => tType.includes(k))) debt = Math.abs(amount);
                    else credit = Math.abs(amount);
                } else {
                    if (['Ödeme', 'Tahsilat', 'Payment', 'Giriş'].some(k => tType.includes(k))) debt = Math.abs(amount);
                    else credit = Math.abs(amount);
                }
                totalProcessedDebt += debt;
                totalProcessedCredit += credit;
                return { ...t, debt, credit };
            });

            const currentBalanceInEntity = Number(entity.balance) || 0;
            const netProcessed = isCustomer ? (totalProcessedDebt - totalProcessedCredit) : (totalProcessedCredit - totalProcessedDebt);

            // For customer, positive balance means they owe us (Debt-Credit)
            // For supplier, positive balance usually means we owe them (Credit-Debt)
            const openingBalance = isCustomer
                ? (currentBalanceInEntity - netProcessed)
                : (currentBalanceInEntity - netProcessed);

            const finalProcessed = [];
            let totalDebt = 0;
            let totalCredit = 0;
            let rb = openingBalance;

            if (Math.abs(openingBalance) > 0.01) {
                totalDebt += (openingBalance > 0 ? openingBalance : 0);
                totalCredit += (openingBalance < 0 ? Math.abs(openingBalance) : 0);
                finalProcessed.push({
                    date: '—',
                    rawDate: '—',
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
                finalProcessed.push({ ...t, balance: rb, rawDate: t.rawDate || t.date });
            });

            if (type === 'summary') {
                const groups: Record<string, any> = {};
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
                const summarized = Object.values(groups)?.map(g => {
                    summaryRb += (g.debt - g.credit);
                    return { ...g, balance: summaryRb };
                });
                return { processedTransactions: summarized, totals: { totalDebt, totalCredit, balance: rb }, groupedDates: {} };
            }

            // For detailed view: group by Month-Year (e.g. "Ekim 2025") or Date string
            const groupedByDate: Record<string, any[]> = {};

            finalProcessed.forEach(t => {
                let gKey = 'Belirsiz Tarih';
                if (t.type === 'Devir') {
                    gKey = 'Açılış / Devir İşlemleri';
                } else if (t.rawDate) {
                    const d = new Date(t.rawDate);
                    if (!isNaN(d.getTime())) {
                        gKey = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }).toUpperCase();
                    } else {
                        gKey = String(t.date).substring(0, 10);
                    }
                }

                if (!groupedByDate[gKey]) groupedByDate[gKey] = [];
                groupedByDate[gKey].push(t);
            });

            return { processedTransactions: finalProcessed, totals: { totalDebt, totalCredit, balance: rb }, groupedDates: groupedByDate };
        } catch (e) {
            console.error('Statement Calculation Error:', e);
            return { processedTransactions: [], totals: { totalDebt: 0, totalCredit: 0, balance: 0 }, groupedDates: {} };
        }
    }, [transactions, entityType, entity, type]);

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
                        <div className="toolbar-icon" style={{ background: '#3b82f6', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>📄</div>
                        <div>
                            <div className="toolbar-title">{title}</div>
                            <div className="toolbar-subtitle">BELGE ÖNİZLEME ({type === 'summary' ? 'ÖZET EKSTRE' : 'DETAYLI EKSTRE'})</div>
                        </div>
                    </div>
                    <div className="toolbar-actions">
                        <button onClick={handlePrint} className="print-btn">
                            <span>🖨️</span> Yazdır / PDF Kaydet
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
                                    <div className="doc-type-label">{entityType === 'CUSTOMER' ? 'MÜŞTERİ HESAP EKSTRESİ' : 'TEDARİKÇİ HESAP EKSTRESİ'} • {type === 'summary' ? 'ÖZET' : 'DETAYLI'}</div>
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

                        {/* Summary Cards-KPI Top Area */}
                        <div className="summary-section">
                            <div className="summary-card">
                                <div className="card-label">TOPLAM BORÇ (MÜŞTERİNİN)</div>
                                <div className="card-value debt">₺{totals.totalDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                            </div>
                            <div className="summary-card">
                                <div className="card-label">TOPLAM ALACAK (YAPILAN TAH.)</div>
                                <div className="card-value credit">₺{totals.totalCredit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                            </div>
                            <div className="summary-card highlight">
                                <div className="card-label">GÜNCEL BAKİYE</div>
                                <div className="card-value">₺{Math.abs(totals.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                                <div className="card-status">{totals.balance > 0 ? (entityType === 'CUSTOMER' ? 'BİZE BORÇLU' : 'FİRMAYA BORÇLUYUZ') : totals.balance < 0 ? (entityType === 'CUSTOMER' ? 'FİRMA ALACAKLI' : 'BİZ ALACAKLIYIZ') : 'DENGELİ'}</div>
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
                                {type === 'summary' ? (
                                    processedTransactions?.map((t: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="date-cell">{t.date}</td>
                                            <td>
                                                <div className="item-desc">{t.desc || t.type}</div>
                                                <div className="item-type">{t.type}</div>
                                            </td>
                                            <td className="text-right debt-cell">{t.debt > 0 ? t.debt.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '—'}</td>
                                            <td className="text-right credit-cell">{t.credit > 0 ? t.credit.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '—'}</td>
                                            <td className="text-right balance-cell">₺{t.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))
                                ) : (
                                    // Detailed view with grouped collapsible
                                    Object.entries(groupedDates)?.map(([gDate, items], gIdx) => (
                                        <DetailedGroupRow key={gIdx} groupDate={gDate} items={items as any[]} />
                                    ))
                                )}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={2} className="text-right total-label">GENEL TOPLAM</td>
                                    <td className="text-right total-debt">₺{totals.totalDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                    <td className="text-right total-credit">₺{totals.totalCredit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                    <td className="text-right total-balance">₺{Math.abs(totals.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
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
                                <div className="stamp-box">KASE VE İMZA</div>
                                <div className="stamp-box">MÜŞTERİ ONAYI</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                            .statement-modal-overlay {
                            position: fixed;
                            inset: 0;
                            background: rgba(15, 23, 42, 0.85); /* Deep navy background from Dark mode rule */
                            
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            z-index: 999999;
                            padding: 40px;
                        }
                .statement-modal-container {
                    width: 100 %;
                    max-width: 1000px;
                    height: 95vh;
                    background: #0f111a;
                    border-radius: 24px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.05); /* Border subtle rule */
                }
                .statement-toolbar {
            padding: 24px 32px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0 %, rgba(37, 99, 235, 0.02) 100 %);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
}
                .toolbar-info { display: flex; align-items: center; gap: 16px; }
                .toolbar-title { color: white; font-weight: 800; font-size: 18px; }
                .toolbar-subtitle { color: #3b82f6; font-size: 11px; font-weight: 800; letter-spacing: 2px; margin-top: 4px; }
                
                .toolbar-actions { display: flex; align-items: center; gap: 16px; }
                .print-btn {
    background: #3b82f6; /* Blue primary rule */
    color: white;
    border: 1px solid rgba(59, 130, 246, 0.4);
    padding: 12px 24px;
    border-radius: 14px; /* Radius 14px rule */
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
    display: flex;
    align-items: center;
    gap: 8px;
}
                .print-btn:hover { background: #2563eb; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3); }
                .close-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    transition: 0.2s;
}
                .close-btn:hover { background: rgba(255, 255, 255, 0.1); }

                .document-scroller {
    flex: 1;
    overflow-y: auto;
    padding: 40px 0;
    background: #080a0f;
    display: block;
}
                .paper-document {
    width: 95 %;
    max-width: 820px;
    background: white;
    color: #0f172a;
    padding: 60px;
    margin: 0 auto 40px auto;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    min-height: 1160px;
    height: auto;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
}

                .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px; border-bottom: 2px solid #0f172a; padding-bottom: 24px; }
                .brand-section { display: flex; align-items: center; gap: 16px; }
                .brand-logo { width: 48px; height: 48px; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; border-radius: 12px; }
                .brand-name { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
                .doc-type-label { color: #3b82f6; font-size: 11px; font-weight: 800; letter-spacing: 1px; margin-top: 4px; }
                
                .doc-meta { text-align: right; }
                .meta-item { margin-bottom: 8px; }
                .meta-label { font-size: 9px; color: #64748b; font-weight: 800; display: block; letter-spacing: 1px; }
                .meta-value { font-size: 14px; font-weight: 800; color: #0f172a; }

                .parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 50px; }
                .party-label { font-size: 10px; font-weight: 800; color: #64748b; margin-bottom: 8px; letter-spacing: 1px; }
                .party-name { font-size: 18px; font-weight: 900; margin-bottom: 8px; color: #0f172a; }
                .party-details { font-size: 13px; color: #475569; line-height: 1.6; font-weight: 500; }
                .text-right { text-align: right; }

                .summary-section { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 40px; }
                .summary-card { padding: 24px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; }
                .summary-card.highlight { background: #0f172a; color: white; border: none; }
                .card-label { font-size: 10px; font-weight: 800; color: #64748b; margin-bottom: 8px; letter-spacing: 1px; }
                .summary-card.highlight.card-label { color: #94a3b8; }
                .card-value { font-size: 20px; font-weight: 900; font-family: monospace; }
                .card-value.debt { color: #ef4444; }
                .card-value.credit { color: #10b981; }
                .card-status { font-size: 11px; font-weight: 800; color: #3b82f6; margin-top: 8px; letter-spacing: 0.5px; }

                .doc-table { width: 100 %; border-collapse: collapse; font-size: 13px; }
                .doc-table th { padding: 16px 12px; text-align: left; border-bottom: 2px solid #0f172a; font-weight: 800; font-size: 11px; color: #64748b; letter-spacing: 0.5px; }
                .doc-table td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; }
                .date-cell { color: #64748b; font-weight: 600; font-size: 12px; }
                .item-desc { font-weight: 700; font-size: 13px; color: #1e293b; margin-bottom: 4px; }
                .item-type { font-size: 10px; color: #64748b; font-weight: 800; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; display: inline-block; }
                .debt-cell { color: #ef4444; font-weight: 800; font-family: monospace; font-size: 14px; }
                .credit-cell { color: #10b981; font-weight: 800; font-family: monospace; font-size: 14px; }
                .balance-cell { font-weight: 900; background: #f8fafc; font-family: monospace; font-size: 14px; }
                .highlight { background: #f8fafc; }

                .doc-table tfoot td { padding: 24px 12px; font-weight: 900; font-size: 15px; border-top: 2px solid #0f172a; }
                .total-label { color: #64748b; font-size: 12px; letter-spacing: 1px; }
                .total-balance { background: #0f172a; color: white; border-radius: 0 0 8px 0; }
                .total-debt { color: #ef4444; }
                .total-credit { color: #10b981; }

                .doc-footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
                .footer-notes { font-size: 11px; color: #64748b; line-height: 1.8; font-weight: 500; }
                .footer-stamps { display: flex; gap: 32px; }
                .stamp-box { width: 160px; height: 100px; border: 1px dashed #cbd5e1; border-radius: 12px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 12px; font-size: 11px; font-weight: 800; color: #94a3b8; letter-spacing: 1px; }

@media print {
    @page {
        size: A4;
        margin: 1cm;
    }
    html, body { height: auto!important; overflow: visible!important; background: white!important; }
    body * { visibility: hidden; }
        .statement-modal-overlay, .statement-modal-overlay *, #printable-area, #printable-area * { visibility: visible; }
            .statement-modal-overlay { position: absolute!important; top: 0!important; left: 0!important; width: 100 % !important; height: auto!important; background: white!important;  padding: 0!important; margin: 0!important; display: block!important; }
                    .statement-modal-container { position: static!important; width: 100 % !important; height: auto!important; background: white!important; border: none!important; box-shadow: none!important; display: block!important; }
                    .document-scroller { position: static!important; height: auto!important; overflow: visible!important; background: white!important; padding: 0!important; margin: 0!important; display: block!important; }
                    .paper-document { width: 100 % !important; max-width: none!important; padding: 0!important; margin: 0!important; box-shadow: none!important; border: none!important; height: auto!important; min-height: 0!important; }
                    .no-print { display: none!important; height: 0!important; width: 0!important; }

                    /* Expand all groups for print view */
                    .group-row { background: #f1f5f9!important; border-top: 2px solid #0f172a!important; }
                    .group-row td div span { color: #0f172a!important; }
}
`}</style>
        </div>
    );

    return createPortal(modalLayout, document.body);
}
