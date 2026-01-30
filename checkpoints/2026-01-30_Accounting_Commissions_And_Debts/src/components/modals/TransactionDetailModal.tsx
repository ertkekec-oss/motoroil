
"use client";

interface TransactionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: any;
}

export default function TransactionDetailModal({ isOpen, onClose, transaction }: TransactionDetailModalProps) {
    if (!isOpen || !transaction) return null;

    const items = transaction.items || [];
    const isManual = items.length === 0;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
            <div className="card glass animate-in" style={{ width: '600px', background: 'var(--bg-card)', padding: '24px' }}>
                <div className="flex-between mb-6">
                    <h3>📄 İşlem Detayı</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
                </div>

                <div className="flex-col gap-4">
                    <div className="grid-cols-2 gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                        <div>
                            <label className="text-muted" style={{ fontSize: '11px' }}>İŞLEM TARİHİ</label>
                            <div style={{ fontWeight: 'bold' }}>{transaction.date || transaction.invoiceDate}</div>
                        </div>
                        <div>
                            <label className="text-muted" style={{ fontSize: '11px' }}>FATURA / REF NO</label>
                            <div style={{ fontWeight: 'bold' }}>{transaction.method || transaction.invoiceNo}</div>
                        </div>
                    </div>

                    <div>
                        <label className="text-muted" style={{ fontSize: '11px' }}>AÇIKLAMA</label>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', marginTop: '4px' }}>
                            {transaction.desc || transaction.description}
                        </div>
                    </div>

                    <div className="divider" style={{ height: '1px', background: 'var(--border-light)', margin: '10px 0' }}></div>

                    {isManual ? (
                        <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                            <p className="text-muted" style={{ fontSize: '13px' }}>Bu işlem manuel tutar girişi olarak kaydedilmiştir.</p>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '10px', color: 'var(--danger)' }}>
                                {Math.abs(transaction.amount || transaction.totalAmount).toLocaleString()} ₺
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h4 className="mb-3">Ürün Kalemleri</h4>
                            <div className="flex-col gap-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex-between" style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div>
                                            <div style={{ fontWeight: '500' }}>{item.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.qty} adet x {item.price.toLocaleString()} ₺</div>
                                        </div>
                                        <div style={{ fontWeight: 'bold' }}>{(item.qty * item.price).toLocaleString()} ₺</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex-between mt-6" style={{ padding: '15px', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '12px' }}>
                                <span style={{ fontWeight: 'bold' }}>TOPLAM TUTAR:</span>
                                <span style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--danger)' }}>
                                    {Math.abs(transaction.amount || transaction.totalAmount).toLocaleString()} ₺
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex-end mt-4">
                        <button onClick={onClose} className="btn btn-primary" style={{ padding: '10px 30px' }}>Kapat</button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .flex-between { display: flex; align-items: center; justify-content: space-between; }
                .flex-col { display: flex; flex-direction: column; }
                .flex-end { display: flex; align-items: center; justify-content: flex-end; }
                .gap-2 { gap: 8px; }
                .gap-4 { gap: 16px; }
            `}</style>
        </div>
    );
}
