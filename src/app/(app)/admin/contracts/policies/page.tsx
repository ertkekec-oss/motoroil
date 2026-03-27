import { EnterprisePageShell, EnterpriseCard, EnterpriseButton, EnterpriseInput, EnterpriseSelect, EnterpriseSectionHeader } from '@/components/ui/enterprise';
import { Save, ShieldCheck } from 'lucide-react';

export default async function PoliciesPage() {
    return (
        <EnterprisePageShell
            title="Sözleşme & İmza Politikaları (Policies)"
            description="Tenant bazlı genel kurallar. M-FA Zorunluluğu, Token Yaşam Süresi (TTL)."
            actions={
                <EnterpriseButton variant="primary">
                    <Save className="w-4 h-4" /> Politikaları Kaydet
                </EnterpriseButton>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <EnterpriseCard>
                    <EnterpriseSectionHeader 
                        title="Aktif Politika Matrisi" 
                        subtitle="Bu ayarlar tüm yeni oluşturulan zarflara (envelope) snapshot olarak kopyalanacaktır." 
                        icon={<ShieldCheck className="w-5 h-5" />}
                    />
                    
                    <div className="space-y-5">
                        <EnterpriseInput 
                            label="Varsayılan Public Token TTL (Saat)" 
                            type="number" 
                            defaultValue={72} 
                            hint="Zarf bağlantılarının otomatik iptal edilmeden önce geçerli olacağı süre."
                        />

                        <EnterpriseSelect 
                            label="Zorunlu İmza Yöntemi" 
                            hint="Tüm dış katılımcıların doğrulanma şartı."
                        >
                            <option value="NONE">Belirtilmedi (Sadece Email Linki - Serbest Mod)</option>
                            <option value="EMAIL_OTP">Email OTP (Varsayılan)</option>
                            <option value="SMS_OTP">SMS OTP (Kredi Gerektirir)</option>
                        </EnterpriseSelect>

                        <EnterpriseInput 
                            label="Max OTP Deneme Hakkı" 
                            type="number" 
                            defaultValue={5} 
                            hint="Güvenlik nedeniyle 5 üzerinde olması tavsiye edilmez."
                        />
                    </div>
                </EnterpriseCard>
            </div>
        </EnterprisePageShell>
    );
}
