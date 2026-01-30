import { Product } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/utils';

interface InventoryStatsProps {
    products: Product[];
}

export function InventoryStats({ products }: InventoryStatsProps) {
    const inventoryValueResult = () => {
        let buyExt = 0;
        let buyInc = 0;
        let sellExt = 0;
        let sellInc = 0;

        products.forEach(p => {
            const qty = p.stock || 0;
            const bVat = p.purchaseVat || 20;
            const sVat = p.salesVat || 20;

            let bExt, bInc, sExt, sInc;

            if (p.purchaseVatIncluded) {
                bInc = p.buyPrice || 0;
                bExt = (p.buyPrice || 0) / (1 + bVat / 100);
            } else {
                bExt = p.buyPrice || 0;
                bInc = (p.buyPrice || 0) * (1 + bVat / 100);
            }

            if (p.salesVatIncluded) {
                sInc = p.price || 0;
                sExt = (p.price || 0) / (1 + sVat / 100);
            } else {
                sExt = p.price || 0;
                sInc = (p.price || 0) * (1 + sVat / 100);
            }

            buyExt += bExt * qty;
            buyInc += bInc * qty;
            sellExt += sExt * qty;
            sellInc += sInc * qty;
        });

        return { buyExt, buyInc, sellExt, sellInc };
    };

    const stats = inventoryValueResult();

    return (
        <div className="grid-cols-4 gap-4 mb-6">
            <div className="card glass" style={{ padding: '20px' }}>
                <div className="text-muted" style={{ fontSize: '11px', fontWeight: '800' }}>TOPLAM ÜRÜN</div>
                <div style={{ fontSize: '32px', fontWeight: '900', marginTop: '8px' }}>{products.length}</div>
            </div>
            <div className="card glass" style={{ padding: '20px' }}>
                <div className="text-muted" style={{ fontSize: '11px', fontWeight: '800' }}>ALIŞ DEĞERİ (KDV Hariç)</div>
                <div style={{ fontSize: '32px', fontWeight: '900', marginTop: '8px', color: 'var(--success)' }}>
                    {formatCurrency(stats.buyExt)}
                </div>
            </div>
            <div className="card glass" style={{ padding: '20px' }}>
                <div className="text-muted" style={{ fontSize: '11px', fontWeight: '800' }}>SATIŞ DEĞERİ (KDV Hariç)</div>
                <div style={{ fontSize: '32px', fontWeight: '900', marginTop: '8px', color: 'var(--primary)' }}>
                    {formatCurrency(stats.sellExt)}
                </div>
            </div>
            <div className="card glass" style={{ padding: '20px' }}>
                <div className="text-muted" style={{ fontSize: '11px', fontWeight: '800' }}>TAHMİNİ KAR</div>
                <div style={{ fontSize: '32px', fontWeight: '900', marginTop: '8px', color: 'var(--warning)' }}>
                    {formatCurrency(stats.sellExt - stats.buyExt)}
                </div>
            </div>
        </div>
    );
}
