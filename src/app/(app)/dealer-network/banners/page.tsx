"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    EnterprisePageShell,
    EnterpriseCard,
    EnterpriseButton,
    EnterpriseSwitch
} from "@/components/ui/enterprise";
import { Save, AlertCircle, Plus, GripVertical, Trash2, Link as LinkIcon, Image as ImageIcon, Loader2 } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";

export default function BannerManagementPage() {
    const { showError, showSuccess, showConfirm } = useModal();
    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/dealer-network/banners');
            if (!res.ok) throw new Error("Banners fetching failed");
            const data = await res.json();
            setBanners(data || []);
        } catch (e: any) {
            showError("Hata", e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const uploadRes = await fetch("/api/uploads/banners", {
                method: "POST",
                body: formData
            });

            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error || "Yükleme başarısız");

            // Create banner record
            const createRes = await fetch("/api/dealer-network/banners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageUrl: uploadData.imageUrl,
                    isActive: true
                })
            });

            if (!createRes.ok) throw new Error("Kayıt oluşturulamadı");
            const newBanner = await createRes.json();
            setBanners(prev => [...prev, newBanner]);
            showSuccess("Başarılı", "Yeni banner eklendi.");
        } catch (err: any) {
            showError("Hata", err.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDelete = (id: string) => {
        showConfirm(
            "Banner'ı Sil",
            "Bu banner'ı kalıcı olarak silmek istediğinize emin misiniz?",
            async () => {
                try {
                    const res = await fetch(`/api/dealer-network/banners/${id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error("Silinemedi");
                    setBanners(prev => prev.filter(b => b.id !== id));
                    showSuccess("Kaldırıldı", "Banner başarıyla silindi.");
                } catch (e: any) {
                    showError("Hata", e.message);
                }
            }
        );
    };

    const updateBannerField = async (id: string, field: string, value: any) => {
        const target = banners.find(b => b.id === id);
        if (!target) return;

        // Optimistic UI update
        const originalValue = target[field];
        setBanners(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
        
        try {
            const res = await fetch(`/api/dealer-network/banners/${id}`, {
                method: 'PATCH',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...target, [field]: value })
            });
            
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${res.status}`);
            }
        } catch (e: any) {
            // Revert state
            setBanners(prev => prev.map(b => b.id === id ? { ...b, [field]: originalValue } : b));
            showError("Hata", e.message || "Banner güncellenemedi.");
        }
    };

    if (loading) {
        return (
            <EnterprisePageShell title="Banner Yönetimi" description="">
                <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" /></div>
            </EnterprisePageShell>
        );
    }

    return (
        <EnterprisePageShell
            title="Katalog Banner Yönetimi"
            description="B2B kataloğunun tepesinde görünecek duyuru ve kampanya görsellerini buradan yönetebilirsiniz."
            actions={
                <div>
                    <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handleFileSelected} />
                    <EnterpriseButton onClick={handleUploadClick} disabled={uploading}>
                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                        {uploading ? "Yükleniyor..." : "Yeni Görsel Ekle"}
                    </EnterpriseButton>
                </div>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {banners.map((banner) => (
                    <EnterpriseCard key={banner.id} className="overflow-hidden p-0 relative group">
                        <div className="h-40 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 relative">
                            <img src={banner.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleDelete(banner.id)}
                                    className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-sm"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" /> Gösterim
                                </span>
                                <EnterpriseSwitch 
                                    checked={banner.isActive} 
                                    onChange={(e) => updateBannerField(banner.id, 'isActive', e.target.checked)} 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                                    <LinkIcon className="w-3 h-3" /> Tıklama Linki (İsteğe Bağlı)
                                </label>
                                <input
                                    type="text"
                                    value={banner.linkUrl || ''}
                                    placeholder="https://"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-[#0f172a] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    onBlur={(e) => updateBannerField(banner.id, 'linkUrl', e.target.value)}
                                    onChange={(e) => setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, linkUrl: e.target.value } : b))}
                                />
                            </div>
                        </div>
                    </EnterpriseCard>
                ))}

                {banners.length === 0 && !uploading && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                        <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">Henüz Banner Yok</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                            Kataloğunuzda sergilemek için "Yeni Görsel Ekle" butonunu kullanarak jpg, png, webp formatında görseller ekleyebilirsiniz.
                        </p>
                    </div>
                )}
            </div>
        </EnterprisePageShell>
    );
}
