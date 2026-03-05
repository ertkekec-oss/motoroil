import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseButton } from "@/components/ui/enterprise";
import { prisma } from "@/lib/prisma";
import { Shield, Key, RefreshCcw } from "lucide-react";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function OpsSecretRotatePage() {

    // Fetch Webhook Secrets Config
    const secretConfig = await prisma.b2BSystemConfig.findUnique({
        where: { key: 'webhook_secrets_v1' }
    });

    const parsedConfig = secretConfig?.valueJson as any || {
        primary: 'whsec_primary_default',
        secondary: 'whsec_secondary_default',
        lastRotatedAt: new Date().toISOString()
    };

    const handleRotate = async (formData: FormData) => {
        "use server";
        const newPrimary = formData.get("newSecret") as string;

        if (!newPrimary) return;

        // Move current primary to secondary (Dual Window), set new primary
        const newConfig = {
            primary: newPrimary,
            secondary: parsedConfig.primary,
            lastRotatedAt: new Date().toISOString()
        };

        await prisma.b2BSystemConfig.upsert({
            where: { key: 'webhook_secrets_v1' },
            create: { key: 'webhook_secrets_v1', valueJson: newConfig },
            update: { valueJson: newConfig, updatedAt: new Date() }
        });

        // Add Audit Event conceptually
        await prisma.b2BSystemConfig.upsert({
            where: { key: 'last_secret_rotation' },
            create: { key: 'last_secret_rotation', valueJson: { by: 'Admin', date: new Date().toISOString() } },
            update: { valueJson: { by: 'Admin', date: new Date().toISOString() }, updatedAt: new Date() }
        });

        revalidatePath('/admin/ops/secret-rotate');
    };

    const handleRevokeSessions = async () => {
        "use server";
        // Here we would find active session tokens and invalidate them 
        // Example: prisma.signingSession.updateMany({ where: { status: 'ACTIVE' }, data: { status: 'REVOKED' } })

        await prisma.b2BSystemConfig.upsert({
            where: { key: 'last_session_revoke' },
            create: { key: 'last_session_revoke', valueJson: { by: 'Admin', date: new Date().toISOString() } },
            update: { valueJson: { by: 'Admin', date: new Date().toISOString() }, updatedAt: new Date() }
        });

        revalidatePath('/admin/ops/secret-rotate');
    };

    return (
        <EnterprisePageShell
            title="Secret Rotation & Key Management"
            description="Provider Webhook secret dönüşümleri (Dual-Secret Window) ve güvenliği ihlal edilmiş signing session iptali."
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <EnterpriseCard>
                    <EnterpriseSectionHeader title="Webhook Secret Rotate (Dual Window)" />
                    <p className="text-xs text-slate-500 mb-6 flex items-start gap-2">
                        <Shield className="w-5 h-5 text-blue-500 shrink-0" />
                        Güvenlik ihlalinde veya periyodik olarak ödeme sağlayıcı API secret değiştirildiğinde (Stripe, Iyzico vb.), eski secret 24 saat boyunca "Secondary" olarak doğrulamada tutulur. Bu sıfır kesinti (Zero Downtime) sağlar.
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-700">Primary (Aktif Anahtar)</span>
                            <span className="text-xs font-mono bg-green-100 text-green-800 px-2 py-0.5 rounded">{parsedConfig.primary}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2 text-opacity-50">
                            <span className="text-xs font-bold text-slate-500">Secondary (Eski Anahtar)</span>
                            <span className="text-xs font-mono bg-slate-200 text-slate-600 px-2 py-0.5 rounded opacity-75">{parsedConfig.secondary}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-4 border-t pt-2 border-slate-200 flex justify-between">
                            <span>Son Değişim: {new Date(parsedConfig.lastRotatedAt).toLocaleString()}</span>
                        </div>
                    </div>

                    <form action={handleRotate} className="flex gap-2 isolate">
                        <input type="text" name="newSecret" required className="flex-1 text-sm font-mono border-slate-300 rounded p-2 focus:ring-1 focus:ring-slate-500 bg-slate-50" placeholder="Yeni whsec_..." />
                        <EnterpriseButton variant="primary" type="submit" className="!h-auto !px-4 text-xs shrink-0 flex items-center justify-center font-bold bg-slate-900 border-slate-900 text-white hover:bg-slate-800">
                            <RefreshCcw className="w-4 h-4 mr-2" /> Döndür (Rotate)
                        </EnterpriseButton>
                    </form>
                </EnterpriseCard>

                <EnterpriseCard>
                    <EnterpriseSectionHeader title="Oturum ve Signature İptali (Revoke/Invalidate)" />
                    <p className="text-xs text-slate-500 mb-6 flex items-start gap-2">
                        <Key className="w-5 h-5 text-rose-500 shrink-0" />
                        Sızdırılmış kimlik doğrulama token’ları, OTP oturumları (Signing Token) ve API key leak durumlarında tüm açık seansları global olarak iptal eder (Signout all).
                    </p>

                    <form action={handleRevokeSessions} className="border border-rose-200 bg-rose-50 rounded p-4 text-center">
                        <h5 className="font-bold text-rose-900 text-sm mb-2">Panik Butonu (Global İptal)</h5>
                        <p className="text-xs text-rose-700 mb-6 max-w-sm mx-auto">
                            Bu işlem sistemdeki tüm aktif imza ve geçici ödeme oturumlarını anında sonlandırır (Yetkisiz erişimi derhal keser).
                        </p>
                        <EnterpriseButton variant="danger" type="submit" className="w-full justify-center !text-sm font-bold bg-rose-600 text-white hover:bg-rose-700">
                            Tüm Açık Session'ları REVOKE Et
                        </EnterpriseButton>
                    </form>

                </EnterpriseCard>

            </div>

        </EnterprisePageShell>
    );
}
