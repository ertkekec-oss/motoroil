"use client";

import React, { useState, useEffect } from "react";
import {
    EnterprisePageShell,
    EnterpriseCard,
    EnterpriseButton,
    EnterpriseSwitch
} from "@/components/ui/enterprise";
import { Save, AlertCircle, Settings2, CreditCard, Box, Info, Truck } from "lucide-react";

export default function DealerNetworkSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/dealer-network/settings');
                if (!res.ok) throw new Error('Ayar bilgisi çekilemedi veya yetkiniz yok.');
                const data = await res.json();
                setSettings({
                    creditPolicy: data.creditPolicy || 'HARD_LIMIT',
                    hardLimitBlock: data.hardLimitBlock ?? true,
                    forceCardOnLimit: data.forceCardOnLimit ?? false,
                    approvalRequiresPaymentIfFlagged: data.approvalRequiresPaymentIfFlagged ?? true,
                    showLimitOnCartUI: data.showLimitOnCartUI ?? true,
                    shippingCost: data.shippingCost || '',
                    freeShippingThreshold: data.freeShippingThreshold || ''
                });
            } catch (err: any) {
                setError(err.message || "İşlem başarısız oldu");
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleChange = (key: string, value: any) => {
        setSettings((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        try {
            const res = await fetch('/api/dealer-network/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (!res.ok) {
                throw new Error("Ayarlar kaydedilemedi. Lütfen tekrar deneyin.");
            }

            // show success logic if needed (e.g. toast)

        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const actions = (
        <EnterpriseButton onClick={handleSave} disabled={loading || saving}>
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </EnterpriseButton>
    );

    if (loading) {
        return (
            <EnterprisePageShell title="Dealer Network Ayarları" description="">
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">Yükleniyor...</div>
            </EnterprisePageShell>
        );
    }

    if (error && !settings) {
        return (
            <EnterprisePageShell title="Dealer Network Ayarları" description="">
                <div className="p-8 text-center text-red-500 font-bold bg-red-50 rounded-lg">{error}</div>
            </EnterprisePageShell>
        );
    }

    return (
        <EnterprisePageShell
            title="Bayi Ağı (Dealer Network) Ayarları"
            description="Tenantınıza bağlı bayilerin kredi kullanım kuralları ve portal içerisindeki onay davranışlarını yönetin."
            actions={actions}
        >
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="font-semibold">{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. KREDI POLITIKASI (MAIN CARD) */}
                <div className="lg:col-span-2 space-y-6">
                    <EnterpriseCard>
                        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4 mb-5">
                            <CreditCard className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Kredi Limiti Politikası</h2>
                        </div>

                        <div className="space-y-4">
                            <label
                                className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${settings?.creditPolicy === 'HARD_LIMIT' ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                                onClick={() => handleChange('creditPolicy', 'HARD_LIMIT')}
                            >
                                <div className="flex items-center h-5 mr-3 mt-0.5">
                                    <input
                                        type="radio"
                                        className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-white/10 focus:ring-indigo-500"
                                        checked={settings?.creditPolicy === 'HARD_LIMIT'}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white text-[15px]">Hard Limit (Kesin Engel)</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Bayi limiti aştığı an "Açık Hesap / Veresiye" ile ödeme yapması engellenir ve sipariş onaylanmaz. (Risk %0)</div>
                                </div>
                            </label>

                            <label
                                className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${settings?.creditPolicy === 'SOFT_LIMIT' ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                                onClick={() => handleChange('creditPolicy', 'SOFT_LIMIT')}
                            >
                                <div className="flex items-center h-5 mr-3 mt-0.5">
                                    <input
                                        type="radio"
                                        className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-white/10 focus:ring-indigo-500"
                                        checked={settings?.creditPolicy === 'SOFT_LIMIT'}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white text-[15px]">Soft Limit (Esnek Onay)</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sipariş verilebilir ancak limit aşımı varsa "Onay Bekliyor" adımına düşer ve Risk olarak işaretlenir. Tenant temsilcisi serbest bırakabilir.</div>
                                </div>
                            </label>

                            <label
                                className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${settings?.creditPolicy === 'FORCE_CARD_ON_LIMIT' ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                                onClick={() => handleChange('creditPolicy', 'FORCE_CARD_ON_LIMIT')}
                            >
                                <div className="flex items-center h-5 mr-3 mt-0.5">
                                    <input
                                        type="radio"
                                        className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-white/10 focus:ring-indigo-500"
                                        checked={settings?.creditPolicy === 'FORCE_CARD_ON_LIMIT'}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white text-[15px]">Limit Durumunda Sadece Kredi Kartı</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Açık Hesap (Veresiye) limiti dolduğunda sistem Açık Hesap seçeneğini kilitler ancak limiti yetmeyen tutarı (veya tamamını) Kredi Kartı ile çekmesine izin verip siparişi geçirir.</div>
                                </div>
                            </label>
                        </div>
                    </EnterpriseCard>

                    {/* 2. OPERASYON GUVENCELERI */}
                    <EnterpriseCard>
                        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4 mb-5">
                            <Settings2 className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Operasyon İşleyiş Güvenceleri</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 pr-8">
                                    <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">Onay İçin Ödeme Şartı (Payment Required Flag)</div>
                                    <div className="text-[13px] text-slate-500 dark:text-slate-400">Özel bayilerde veya sözleşmeli siparişlerde "Ödeme Alınması Gerekiyor" işareti varsa, bayi tahsilatı yapmadan siparişi onaylanmış sayılmaz (Approve aşamasını bloklar).</div>
                                </div>
                                <EnterpriseSwitch
                                    checked={settings?.approvalRequiresPaymentIfFlagged}
                                    onChange={(val) => handleChange('approvalRequiresPaymentIfFlagged', val)}
                                />
                            </div>

                            <hr className="border-slate-100 dark:border-slate-800" />

                            <div className="flex items-start justify-between">
                                <div className="flex-1 pr-8">
                                    <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">Bayi Sepetinde Görünür Limit Skalası</div>
                                    <div className="text-[13px] text-slate-500 dark:text-slate-400">Bayi kendi dış portalında (/network) sipariş oluştururken veya sepette, güncel kullanılabilir limitini ve aşım riskini anlık olarak görür. Gözetim altında hissettirir.</div>
                                </div>
                                <EnterpriseSwitch
                                    checked={settings?.showLimitOnCartUI}
                                    onChange={(val) => handleChange('showLimitOnCartUI', val)}
                                />
                            </div>
                        </div>
                    </EnterpriseCard>

                    {/* 3. KARGO YONETIMI */}
                    <EnterpriseCard>
                        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4 mb-5">
                            <Truck className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Kargo Yönetimi</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">Sabit Kargo Ücreti (₺)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={settings?.shippingCost || ''}
                                    onChange={(e) => handleChange('shippingCost', e.target.value)}
                                    placeholder="Örn: 99.90"
                                    className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                />
                                <p className="text-[13px] text-slate-500 mt-2">Sepete yansıtılacak varsayılan kargo gönderim bedeli.</p>
                            </div>

                            <hr className="border-slate-100 dark:border-slate-800" />

                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">Ücretsiz Kargo Sepet Tutarı (₺)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={settings?.freeShippingThreshold || ''}
                                    onChange={(e) => handleChange('freeShippingThreshold', e.target.value)}
                                    placeholder="Örn: 1500"
                                    className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                />
                                <p className="text-[13px] text-slate-500 mt-2">Bu tutarın üzerindeki alışverişlerde sistem kargoyu ücretsiz hale getirir.</p>
                            </div>
                        </div>
                    </EnterpriseCard>
                </div>

                {/* 3. BILGILENDIRME (READ-ONLY SIDE) */}
                <div className="space-y-6">
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-5 flex gap-3 text-sm text-amber-800 dark:text-amber-300 shadow-sm align-start shadow-amber-500/5">
                        <Info className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold block mb-1">Kimlik & OTP Politikaları</span>
                            Platform genelindeki OTP doğrulama gereksinimleri (SMS vs.), güvenli giriş protokolleri ve yetki doğrulama politikaları; platform yöneticileri tarafından küresel ölçekte yönetilir ve burada görünmez.
                        </div>
                    </div>

                    <EnterpriseCard className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                            <Box className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Etki Alanı (Scope) Bilgisi</h3>
                        </div>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Bu ayarlar yalnızca bulunduğunuz firmaya (Tenant) bağlı ve davet ettiğiniz bayilerin (/network ve /dealer-network kapsamındaki) davranışlarını belirler. <br /><br /><strong>Hub</strong> veya <strong>Global B2B Market</strong> üzerinde yapılan harici alışverişlerde bu limit kuralları geçerli değildir.
                        </p>
                    </EnterpriseCard>
                </div>

            </div>
        </EnterprisePageShell>
    );
}
