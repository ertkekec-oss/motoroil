import { Product } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/utils';

interface ProductTableProps {
    products: Product[];
    selectedIds: number[];
    setSelectedIds: (ids: number[]) => void;
    onProductClick: (product: Product) => void;
    canEdit: boolean;
}

export function ProductTable({
    products,
    selectedIds,
    setSelectedIds,
    onProductClick,
    canEdit
}: ProductTableProps) {
    const toggleSelection = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === products.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(products.map(p => Number(p.id)));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ok': return 'var(--success)';
            case 'low': return 'var(--warning)';
            case 'out': return 'var(--danger)';
            default: return 'var(--text-muted)';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ok': return 'Normal';
            case 'low': return 'Azalıyor';
            case 'out': return 'Tükendi';
            default: return 'Bilinmiyor';
        }
    };

    return (
        <div className="card glass" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '12px', textAlign: 'left' }}>
                            <input
                                type="checkbox"
                                checked={selectedIds.length === products.length && products.length > 0}
                                onChange={toggleSelectAll}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                        </th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>KOD</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>ÜRÜN ADI</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>KATEGORİ</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>MARKA</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>STOK</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>ALIŞ</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>SATIŞ</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>DURUM</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <tr
                            key={product.id}
                            onClick={() => canEdit && onProductClick(product)}
                            style={{
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                cursor: canEdit ? 'pointer' : 'default',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <td style={{ padding: '12px' }} onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(Number(product.id))}
                                    onChange={() => toggleSelection(Number(product.id))}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                            </td>
                            <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--primary)' }}>
                                {product.code}
                            </td>
                            <td style={{ padding: '12px', fontWeight: '600' }}>{product.name}</td>
                            <td style={{ padding: '12px' }}>
                                <span style={{
                                    fontSize: '11px',
                                    padding: '4px 8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '6px'
                                }}>
                                    {product.category || 'Kategorisiz'}
                                </span>
                            </td>
                            <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{product.brand || '-'}</td>
                            <td style={{
                                padding: '12px',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                color: product.stock <= 0 ? 'var(--danger)' : product.stock <= 5 ? 'var(--warning)' : 'var(--success)'
                            }}>
                                {product.stock}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', color: 'var(--success)' }}>
                                {formatCurrency(Number(product.buyPrice))}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', color: 'var(--primary)', fontWeight: 'bold' }}>
                                {formatCurrency(Number(product.price))}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                <span style={{
                                    fontSize: '10px',
                                    padding: '4px 10px',
                                    background: `${getStatusColor(product.status)}20`,
                                    color: getStatusColor(product.status),
                                    borderRadius: '12px',
                                    fontWeight: '800'
                                }}>
                                    {getStatusLabel(product.status)}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {products.length === 0 && (
                        <tr>
                            <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                Filtrelere uygun ürün bulunamadı.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
