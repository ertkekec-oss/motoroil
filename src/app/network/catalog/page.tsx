"use client"

import React, { useState, useEffect } from "react"
import { useModal } from "@/contexts/ModalContext"
import { ShoppingCart } from "lucide-react"

export default function NetworkCatalogPage() {
    const { showError, showSuccess } = useModal()
    const [q, setQ] = useState("")
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState<any[]>([])
    const [addingToCart, setAddingToCart] = useState<string | null>(null)

    useEffect(() => {
        const timer = setTimeout(() => fetchCatalog(), 300)
        return () => clearTimeout(timer)
    }, [q])

    const fetchCatalog = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/network/catalog?q=${encodeURIComponent(q)}`)
            const data = await res.json()
            if (data.ok) {
                setProducts(data.products)
            } else {
                showError("Katalog", "Ürünler yüklenemedi: " + (data.error || "Bilinmeyen hata"))
            }
        } catch (e: any) {
            showError("Hata", "Ağ hatası: " + e.message)
        } finally {
            setLoading(false)
        }
    }

    const addToCart = async (p: any, qty: number) => {
        setAddingToCart(p.id)
        try {
            // Minimal test logic or existing cart store implementation
            const res = await fetch("/api/network/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: p.id,
                    quantity: qty,
                    catalogItemId: p.catalogItemId
                })
            })

            const data = await res.json()
            if (data.ok || res.ok) {
                showSuccess("Sepet", `${qty} adet ${p.name} sepete eklendi.`)
            } else {
                showError("Sepet Hatası", data.error || "Eklenemedi")
            }
        } catch (e: any) {
            showError("Hata", "Ağ hatası: " + e.message)
        } finally {
            setAddingToCart(null)
        }
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Ürün Kataloğu</h1>
                <p className="mt-2 text-sm text-slate-500">Tedarikçinizin sizin için açtığı ürünler ve özel fiyatlar.</p>
            </div>

            <div className="mb-6 max-w-lg">
                <input
                    type="text"
                    placeholder="Ürün adı veya kodu ile ara..."
                    className="w-full rounded-md border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center p-12 text-slate-500">Katalog yükleniyor...</div>
            ) : products.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                    Aranan kriterlere uygun ürün bulunamadı.
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.map((p) => (
                        <div key={p.id} className="relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                            <div className="flex h-48 items-center justify-center bg-slate-50 px-4 py-8">
                                {/* placeholder image */}
                                <div className="text-slate-300">
                                    <ShoppingCart size={48} />
                                </div>
                            </div>
                            <div className="flex flex-1 flex-col p-4">
                                <div className="text-xs text-slate-400 mb-1">{p.sku}</div>
                                <h3 className="font-medium text-slate-900 line-clamp-2 leading-snug">{p.name}</h3>
                                <div className="mt-auto pt-4 flex items-end justify-between">
                                    <div>
                                        <div className="text-sm font-semibold text-blue-600">
                                            {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p.priceResolved)}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">Stok: {p.stock}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            disabled={addingToCart === p.id || p.stock < p.minOrderQty}
                                            onClick={() => addToCart(p, p.minOrderQty)}
                                            className="inline-flex h-8 items-center justify-center rounded-lg bg-slate-900 px-3 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                                        >
                                            {addingToCart === p.id ? "Eklendi..." : "Ekle"}
                                        </button>
                                    </div>
                                </div>
                                {(p.minOrderQty > 1 || p.maxOrderQty) && (
                                    <div className="mt-3 text-xs text-slate-400 bg-slate-50 p-2 rounded">
                                        {p.minOrderQty > 1 && <span>Min: {p.minOrderQty} </span>}
                                        {p.maxOrderQty && <span>Max: {p.maxOrderQty} </span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
