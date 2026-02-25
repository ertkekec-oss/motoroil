"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { initiateShipmentAction } from '@/actions/initiateShipmentAction';
import { PackageOpen, FileText } from 'lucide-react';

export default function PartialShipmentManager({
    orderId,
    originalItems
}: {
    orderId: string,
    originalItems: any[]
}) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Basic local state: check items all default to full quantity.
    const [selectedItems, setSelectedItems] = useState(
        originalItems.map(i => ({ productId: i.productId || i.id, qty: i.quantity || i.qty, max: i.quantity || i.qty }))
    );

    const handleShipItems = async () => {
        const payloadItems = selectedItems.filter(i => i.qty > 0).map(i => ({ productId: i.productId, qty: i.qty }));

        if (payloadItems.length === 0) {
            alert("Gönderilecek en az 1 miktar belirtmelisiniz.");
            return;
        }

        if (!confirm(`Seçili ${payloadItems.length} kalem ürün kargo çıkışı yapılacak ve stoktan otomatik düşülecektir. Onaylıyor musunuz?`)) return;

        setLoading(true);
        try {
            await initiateShipmentAction(orderId, {
                mode: 'INTEGRATED',
                carrierCode: 'MOCK', // User dropdown could select Yurtiçi, MNG
                items: payloadItems
            });
            router.refresh();
        } catch (e: any) {
            alert(e.message || "Bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <PackageOpen className="w-5 h-5 text-gray-400" />
                Kargo (Shipment) Başlat
            </h3>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                Siparişteki ürünleri tek seferde veya parçalı (partial) olarak gönderin. Stoğunuz otomatik düşülecek ve barkod hazırlanacaktır.
            </p>

            <div className="border border-gray-100 rounded-xl overflow-hidden mb-5">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-xs text-gray-500 font-semibold border-b border-gray-100 uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3">Ürün</th>
                            <th className="px-4 py-3 w-32">Miktar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {selectedItems.map((item, idx) => (
                            <tr key={item.productId} className="bg-white">
                                <td className="px-4 py-3 font-medium text-gray-900">
                                    {/* Placeholder name as we stripped real names off the item JSON typically, in prod join them */}
                                    Ürün #{item.productId.slice(-6).toUpperCase()}
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        min="0"
                                        max={item.max}
                                        value={item.qty}
                                        onChange={(e) => {
                                            const val = Math.max(0, Math.min(item.max, Number(e.target.value)));
                                            const newState = [...selectedItems];
                                            newState[idx].qty = val;
                                            setSelectedItems(newState);
                                        }}
                                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-black focus:border-black"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <button
                onClick={handleShipItems}
                disabled={loading}
                className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-4 h-4" /> : <FileText className="w-4 h-4" />}
                {loading ? 'Barkod Üretiliyor...' : 'Barkod Üret & Gönder'}
            </button>
        </div>
    );
}
