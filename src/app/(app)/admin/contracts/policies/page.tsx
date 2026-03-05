import { EnterprisePageShell, EnterpriseCard, EnterpriseButton } from '@/components/ui/enterprise';

export default async function PoliciesPage() {
    return (
        <EnterprisePageShell
            title="Sözleşme & İmza Politikaları (Policies)"
            description="Tenant bazlı genel kurallar. M-FA Zorunluluğu, Token Yaşam Süresi (TTL)."
            actions={
                <EnterpriseButton variant="primary">
                    Politikaları Kaydet
                </EnterpriseButton>
            }
        >
            <EnterpriseCard>
                <div className="border-b pb-4 mb-4 dark:border-slate-800">
                    <h3 className="text-lg font-medium">Aktif Politika Matrisi</h3>
                    <p className="text-sm text-slate-500">Bu ayarlar tüm yeni oluşturulan zarflara (envelope) snapshot olarak kopyalanacaktır.</p>
                </div>
                <div className="space-y-4 max-w-lg mt-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Varsayılan Public Token TTL (Saat)</label>
                        <input type="number" defaultValue={72} className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Zorunlu İmza Yöntemi</label>
                        <select className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700">
                            <option value="NONE">Belirtilmedi (Sadece Email Linki - Serbest Mod)</option>
                            <option value="EMAIL_OTP">Email OTP (Varsayılan)</option>
                            <option value="SMS_OTP">SMS OTP (Kredi Gerektirir)</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Max OTP Deneme Hakkı</label>
                        <input type="number" defaultValue={5} className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700" />
                    </div>
                </div>
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
