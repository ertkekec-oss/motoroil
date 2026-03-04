"use client";
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import {
    EnterprisePageShell,
    EnterpriseCard,
    EnterpriseSectionHeader,
    EnterpriseSelect,
    EnterpriseSwitch,
    EnterpriseButton,
    EnterpriseInput
} from "@/components/ui/enterprise";
import { ShieldCheck, Settings2, ShieldAlert } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";

export default function DealerNetworkSettings() {
    const { currentUser } = useApp();
    const { showSuccess } = useModal();
    const [isSaving, setIsSaving] = useState(false);

    // Mock local state for Dealer Network Settings
    const [settings, setSettings] = useState({
        creditPolicy: 'STRICT',
        defaultDiscount: '10',
        autoApproveOrders: false,
        priceListGroup: 'B2B_TIER_1'
    });

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            if (showSuccess) showSuccess("Başarılı", "Dealer Network ayarlarınız kaydedildi.");
        }, 800);
    };

    return (
        <EnterprisePageShell
            title="Dealer Network Ayarları"
            description="Özel bayi ağınızın (Tenant-to-Dealer) çalışma kurallarını, iskonto oranlarını ve kredi politikalarını yönetin."
            actions={
                <EnterpriseButton onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Kaydediliyor..." : "Ayarları Kaydet"}
                </EnterpriseButton>
            }
        >
            <EnterpriseCard>
                <EnterpriseSectionHeader
                    title="Risk ve Kredi Politikası"
                    subtitle="Bayileriniz sipariş girdiğinde uygulanacak finansal risk sınırları."
                    icon={<ShieldCheck className="w-5 h-5 text-slate-500" />}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <EnterpriseSelect
                        label="Kredi Limiti Aşımı Durumunda"
                        hint="Bayinin açık hesabı (escrow/kredi) limiti aştığında ne olacak?"
                        value={settings.creditPolicy}
                        onChange={(e) => setSettings({ ...settings, creditPolicy: e.target.value })}
                    >
                        <option value="STRICT">Siparişi Otomatik Durdur (Katı)</option>
                        <option value="WARNING">Uyarı Verip Onaya Düşür (Esnek)</option>
                        <option value="IGNORE">Risk Alarak Siparişi Onayla</option>
                    </EnterpriseSelect>
                </div>
            </EnterpriseCard>

            <EnterpriseCard>
                <EnterpriseSectionHeader
                    title="Ticari Şartlar & Fiyatlandırma"
                    subtitle="Ağınıza yeni katılan bayilere uygulanacak varsayılan iskontolar."
                    icon={<Settings2 className="w-5 h-5 text-slate-500" />}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <EnterpriseSelect
                        label="Varsayılan Fiyat Listesi"
                        hint="Giriş yapan bayilere gösterilecek baz fiyat kataloğu."
                        value={settings.priceListGroup}
                        onChange={(e) => setSettings({ ...settings, priceListGroup: e.target.value })}
                    >
                        <option value="B2B_TIER_1">Tier 1 (Standart Bayi Listesi)</option>
                        <option value="B2B_TIER_2">Tier 2 (Gümüş Bayi Listesi)</option>
                        <option value="B2B_VIP">VIP (Özel İskontolu Liste)</option>
                    </EnterpriseSelect>

                    <EnterpriseInput
                        label="Varsayılan Ek İskonto (%)"
                        hint="Fiyat listesine ek olarak uygulanacak genel indirim."
                        type="number"
                        min="0"
                        max="100"
                        value={settings.defaultDiscount}
                        onChange={(e) => setSettings({ ...settings, defaultDiscount: e.target.value })}
                    />
                </div>

                <EnterpriseSwitch
                    label="Siparişleri Otomatik Onayla"
                    description="Limit veya risk sorunu dahi olmayan siparişler beklemeden doğrudan sevk aşamasına aktarılır."
                    checked={settings.autoApproveOrders}
                    onChange={(e) => setSettings({ ...settings, autoApproveOrders: e.target.checked })}
                />
            </EnterpriseCard>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg text-orange-600 dark:text-orange-400 shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-300">Platform Güvenlik Bilgisi</h4>
                    <p className="text-xs text-orange-800/80 dark:text-orange-400/80 mt-1 leading-relaxed">
                        Güvenlik kısıtlamaları (Erişim Yöntemleri, OTP Zorunluluğu, Multi-Tenant Auth Kuralları)
                        sadece Periodya Sistem Yöneticisi (SUPER_ADMIN) tarafından Merkezi B2B Ayarları panelinden yapılandırılabilir.
                    </p>
                </div>
            </div>
        </EnterprisePageShell>
    );
}
