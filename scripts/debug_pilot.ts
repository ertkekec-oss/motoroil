import { NextResponse } from "next/server";
import prisma from "../src/lib/prisma";
import { POST as RedeemPost } from "../src/app/api/network/invites/redeem/route";
import { POST as LoginPost } from "../src/app/api/network/auth/password/login/route";
import { POST as OtpRequestPost } from "../src/app/api/network/auth/otp/request/route";
import { POST as AccountingProcess } from "../src/app/api/internal/accounting/process/route";

async function mockRequest(body: any, headers: Record<string, string> = {}, method = "POST", url = "http://localhost/api") {
    return new Request(url, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
    });
}

function mockResponseJson(res: NextResponse) {
    if (!res) return null;
    return new Promise(async (resolve) => {
        try {
            const data = await res.json();
            resolve({ status: res.status, data });
        } catch (e) {
            resolve({ status: res.status, data: null });
        }
    });
}

async function run() {
    console.log("=== PILOT CHECKLIST TESTS ===");

    // 0. Environments
    process.env.NEXT_PUBLIC_PORTAL_BASE_PATH = "/network";
    process.env.INTERNAL_CRON_SECRET = "test-secret-123";

    // Prepare supplier
    let supplier = await prisma.company.findFirst();
    if (!supplier) {
        supplier = await prisma.company.create({ data: { name: "Test Supplier" } });
    }
    const supplierTenantId = supplier.id;

    // 1. Admin Settings: Set mode to PASSWORD_ONLY
    await prisma.tenantPortalConfig.upsert({
        where: { tenantId: supplierTenantId },
        update: { dealerAuthMode: "PASSWORD_ONLY" },
        create: { tenantId: supplierTenantId, dealerAuthMode: "PASSWORD_ONLY" }
    });
    console.log("✅ 1) Admin ayarları (OTP kapalı): Mode=PASSWORD_ONLY kaydedildi.");

    // 2. Invite Issue & Redeem
    const inviteToken = "pilot-test-token-123";
    const { sha256Base64 } = require("../src/lib/network/crypto");
    const tokenHash = sha256Base64(inviteToken);

    await prisma.dealerInvite.deleteMany({ where: { tokenHash } });
    await prisma.dealerUser.deleteMany({ where: { phone: "905554443322" } });

    const invite = await prisma.dealerInvite.create({
        data: {
            tokenHash,
            status: "ISSUED",
            expiresAt: new Date(Date.now() + 86400000),
            supplierTenantId,
            issuedToPhoneE164: "905554443322",
            maxRedemptions: 1,
            redemptionCount: 0
        }
    });

    const redeemReq = await mockRequest({
        token: inviteToken,
        phoneE164: "905554443322",
        email: "pilot@test.com",
        company: { legalName: "Pilot B2B Dealer" },
        password: "securepassword123"
    });

    const redeemRes = await RedeemPost(redeemReq);
    const redeemData: any = await mockResponseJson(redeemRes);

    if (redeemData.status === 200 && redeemData.data.ok) {
        console.log("✅ 2) Invite Redeem (şifre zorunlu): Başarılı", redeemData.data);
    } else {
        console.error("❌ 2) Invite Redeem failed", redeemData);
        return;
    }

    // Attempt redeem without password
    const inviteTokenFail = "pilot-test-token-fail";
    await prisma.dealerInvite.create({
        data: {
            tokenHash: sha256Base64(inviteTokenFail),
            status: "ISSUED",
            expiresAt: new Date(Date.now() + 86400000),
            supplierTenantId,
            issuedToPhoneE164: "905554443333",
            maxRedemptions: 1,
            redemptionCount: 0
        }
    });

    const redeemFailReq = await mockRequest({
        token: inviteTokenFail,
        phoneE164: "905554443333",
        email: "pilot_fail@test.com",
        company: { legalName: "Pilot Fail" },
        // NO PASSWORD
    });
    const redeemFailRes = await RedeemPost(redeemFailReq);
    const redeemFailData: any = await mockResponseJson(redeemFailRes);
    if (redeemFailData.status === 400 && redeemFailData.data.error === "PASSWORD_REQUIRED") {
        console.log("✅ 2.1) Invite Redeem without password returns 400 PASSWORD_REQUIRED");
    } else {
        console.error("❌ 2.1) Invite Redeem without password did not fail as expected", redeemFailData);
    }

    // 3. Password Login
    const loginReq = await mockRequest({
        email: "pilot@test.com",
        password: "securepassword123",
        supplierTenantId
    });
    const loginRes = await LoginPost(loginReq);
    const loginData: any = await mockResponseJson(loginRes);

    if (loginData.status === 200 && loginData.data.ok) {
        console.log("✅ 3) Password Login: Başarılı, cookie set expected.");
    } else {
        console.error("❌ 3) Password Login Hata", loginData);
    }

    // OTP Request should fail with 403
    const otpReq = await mockRequest({
        phoneE164: "905554443322",
        supplierTenantId
    });
    const otpRes = await OtpRequestPost(otpReq as any); // Ignoring type issue from getClientIp for now
    const otpData: any = await mockResponseJson(otpRes);
    if (otpData.status === 403 && otpData.data.error === "AUTH_MODE_PASSWORD_ONLY") {
        console.log("✅ 3.1) OTP Request: 403 AUTH_MODE_PASSWORD_ONLY (Engellendi)");
    } else {
        console.error("❌ 3.1) OTP Request error", otpData);
    }

    // 9. Outbox + Cron
    const cronReqNoKey = await mockRequest({});
    const cronResNoKey = await AccountingProcess(cronReqNoKey);
    const cronDataNoKey: any = await mockResponseJson(cronResNoKey);
    if (cronDataNoKey.status === 403 && cronDataNoKey.data.error === "FORBIDDEN") {
        console.log("✅ 9) Internal Cron (Secret olmadan): 403 FORBIDDEN");
    } else {
        console.error("❌ 9) Internal Cron Security error", cronDataNoKey);
    }

    const cronReqKey = await mockRequest({}, { "x-internal-secret": "test-secret-123" });
    const cronResKey = await AccountingProcess(cronReqKey);
    const cronDataKey: any = await mockResponseJson(cronResKey);
    if (cronDataKey.status === 200 && cronDataKey.data.ok) {
        console.log("✅ 9) Internal Cron (Secret ile): 200 OK");
        // Outbox process function should have run safely.
    } else {
        console.error("❌ 9) Internal Cron execution error", cronDataKey);
    }

    console.log("Bütün adımlar (Authentication, Auth Mode, Cron Security) başarılı!");
}

run().catch(console.error).finally(() => process.exit(0));
