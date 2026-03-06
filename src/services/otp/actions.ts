"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendNetgsmOtp } from "@/lib/otp/netgsm";

export async function saveOtpConfig(providerName: string, data: any) {
    const session = await getSession();
    if (!session || (session.role !== 'SUPERADMIN' && session.role !== 'ADMIN')) {
        return { success: false, error: 'Unauthorized' };
    }

    const tenantId = session.companyId || (session as any).tenantId;

    try {
        const config = await prisma.otpProviderConfig.upsert({
            where: {
                tenantId_providerName: {
                    tenantId,
                    providerName
                }
            },
            update: {
                isEnabled: data.isEnabled,
                apiUsername: data.apiUsername,
                apiPasswordEncrypted: data.apiPasswordEncrypted,
                sender: data.sender,
                otpTemplate: data.otpTemplate,
                codeLength: parseInt(data.codeLength) || 6,
                ttlSeconds: parseInt(data.ttlSeconds) || 180,
                cooldownSeconds: parseInt(data.cooldownSeconds) || 60,
                maxDailyAttempts: parseInt(data.maxDailyAttempts) || 5,
                testPhone: data.testPhone
            },
            create: {
                tenantId,
                providerName,
                isEnabled: data.isEnabled,
                apiUsername: data.apiUsername,
                apiPasswordEncrypted: data.apiPasswordEncrypted,
                sender: data.sender,
                otpTemplate: data.otpTemplate,
                codeLength: parseInt(data.codeLength) || 6,
                ttlSeconds: parseInt(data.ttlSeconds) || 180,
                cooldownSeconds: parseInt(data.cooldownSeconds) || 60,
                maxDailyAttempts: parseInt(data.maxDailyAttempts) || 5,
                testPhone: data.testPhone
            }
        });

        revalidatePath(`/admin/signatures/providers/${providerName.toLowerCase()}`);
        return { success: true, config };

    } catch (e: any) {
        console.error('[OTP Config Save Error]:', e);
        return { success: false, error: 'Sunucu hatası: ' + e.message };
    }
}

export async function testOtpProvider(providerName: string, phone: string, rawCode: string) {
    const session = await getSession();
    if (!session || (session.role !== 'SUPERADMIN' && session.role !== 'ADMIN')) {
        return { success: false, error: 'Unauthorized' };
    }

    const tenantId = session.companyId || (session as any).tenantId;

    try {
        const config = await prisma.otpProviderConfig.findUnique({
            where: {
                tenantId_providerName: {
                    tenantId,
                    providerName
                }
            }
        });

        if (!config) return { success: false, error: 'Provider konfigürasyonu bulunamadı.' };

        if (providerName === 'NETGSM') {
            const res = await sendNetgsmOtp({
                isEnabled: config.isEnabled,
                apiUsername: config.apiUsername,
                apiPasswordEncrypted: config.apiPasswordEncrypted,
                sender: config.sender,
                otpTemplate: config.otpTemplate
            }, phone, rawCode);

            return res;
        }

        return { success: false, error: 'Bilinmeyen sağlayıcı.' };

    } catch (e: any) {
        console.error('[Test OTP Error]:', e);
        return { success: false, error: 'Test sırasında hata oluştu: ' + e.message };
    }
}
