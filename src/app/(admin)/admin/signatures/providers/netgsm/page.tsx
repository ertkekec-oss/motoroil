import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NetgsmClient from "./NetgsmClient";

export default async function NetgsmSettingsPage() {
    const session = await getSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'PLATFORM_ADMIN')) {
        return notFound();
    }

    const tenantId = session.companyId || (session as any).tenantId;

    const config = await prisma.otpProviderConfig.findUnique({
        where: {
            tenantId_providerName: {
                tenantId,
                providerName: 'NETGSM'
            }
        }
    });

    const defaultConfig = {
        isEnabled: false,
        apiUsername: '',
        apiPasswordEncrypted: '',
        sender: '',
        otpTemplate: 'Doğrulama kodunuz: {{code}}',
        codeLength: 6,
        ttlSeconds: 180,
        cooldownSeconds: 60,
        maxDailyAttempts: 5,
        testPhone: ''
    };

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <Link href="/admin/signatures/providers" style={{ color: '#888', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '12px' }} className="hover:text-blue-500">
                            <span style={{ fontSize: '16px' }}>←</span> Sağlayıcılar Listesine Dön
                        </Link>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            Netgsm OTP Ayarları
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>İmza ve mutabakat sistemleri için SMS OTP doğrulama altyapısı.</p>
                    </div>
                </div>

                <NetgsmClient config={config || defaultConfig} />

            </div>
        </div>
    );
}
