
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MobileCustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await fetch('/api/staff/my-customers');
                if (res.ok) {
                    const data = await res.json();
                    setCustomers(data.customers || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.city?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-full bg-[#0f111a]">
            {/* Header */}
            <div className="p-6 bg-[#161b22] sticky top-0 z-10 border-b border-white/5">
                <h1 className="text-2xl font-black mb-4">Müşterilerim</h1>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Müşteri ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 pl-12 text-sm focus:border-blue-500 outline-none transition-all"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
                </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-3">
                {loading ? (
                    <div className="text-center py-12 opacity-50">Yükleniyor...</div>
                ) : filteredCustomers.length > 0 ? (
                    filteredCustomers.map((c) => (
                        <div
                            key={c.id}
                            onClick={() => router.push(`/field-mobile/customers/${c.id}`)}
                            className="bg-[#161b22] border border-white/5 p-4 rounded-3xl active:scale-[0.98] transition-all"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg truncate flex-1">{c.name}</h3>
                                <div className={`text-sm font-black ${Number(c.balance) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    ₺{Number(c.balance).toLocaleString()}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                <span>📍 {c.city || 'Şehir Belirtilmemiş'}</span>
                                {c.category && (
                                    <>
                                        <span>•</span>
                                        <span>🏷️ {c.category.name}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 opacity-30 uppercase font-black text-xs tracking-widest">
                        Müşteri bulunamadı
                    </div>
                )}
            </div>
        </div>
    );
}
