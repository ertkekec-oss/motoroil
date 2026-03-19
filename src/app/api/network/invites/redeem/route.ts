import { NextResponse } from "next/server"
import { prismaRaw as prisma } from "@/lib/prisma"
import { sha256Base64 } from "@/lib/network/crypto"
import { hashPassword } from "@/lib/auth"

export async function POST(req: Request) {
    const body = await req.json().catch(() => null)
    if (!body?.token || !body?.phoneE164 || !body?.company?.legalName || !body?.company?.taxNo) {
        return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 })
    }

    const tokenHash = sha256Base64(String(body.token))
    const phoneE164 = String(body.phoneE164)
    const email = body.email ? String(body.email).toLowerCase() : null
    const legalName = String(body.company.legalName).trim()
    const taxNumber = String(body.company.taxNo).trim()
    const taxOffice = body.company.taxOffice ? String(body.company.taxOffice).trim() : null
    const contactPerson = body.company.contactPerson ? String(body.company.contactPerson).trim() : null
    const iban = body.company.iban ? String(body.company.iban).trim() : null
    const city = body.company.city ? String(body.company.city).trim() : null
    const district = body.company.district ? String(body.company.district).trim() : null
    const address = body.company.address ? String(body.company.address).trim() : null
    const password = body.password ? String(body.password) : null

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch & validate invite
            let supplierTenantId: string | null = null;
            let dealerCompanyId: string | null = null;
            let inviteId: string | null = null;

            // Direct Tenant generic invite
            if (String(body.token).length === 25 && String(body.token).startsWith("c")) {
                const tenantData = await tx.tenant.findUnique({
                    where: { id: String(body.token) },
                    select: { id: true }
                });
                if (tenantData) {
                    supplierTenantId = tenantData.id;
                }
            }

            if (!supplierTenantId) {
                const invite = await tx.dealerInvite.findUnique({
                    where: { tokenHash },
                    select: {
                        id: true,
                        status: true,
                        expiresAt: true,
                        supplierTenantId: true,
                        dealerCompanyId: true,
                        issuedToPhoneE164: true,
                        maxRedemptions: true,
                        redemptionCount: true,
                    },
                })

                if (!invite) throw new RedeemError(404, "INVITE_NOT_FOUND")
                if (invite.status !== "ISSUED") throw new RedeemError(409, "INVITE_NOT_ACTIVE")
                if (invite.expiresAt.getTime() < Date.now()) throw new RedeemError(410, "INVITE_EXPIRED")
                if (invite.redemptionCount >= invite.maxRedemptions) throw new RedeemError(409, "INVITE_ALREADY_REDEEMED")
                if (invite.issuedToPhoneE164 && invite.issuedToPhoneE164 !== phoneE164) {
                    throw new RedeemError(403, "PHONE_MISMATCH")
                }
                supplierTenantId = invite.supplierTenantId;
                dealerCompanyId = invite.dealerCompanyId;
                inviteId = invite.id;
            }

            const config = await tx.tenantPortalConfig.findUnique({
                where: { tenantId: supplierTenantId },
                select: { dealerAuthMode: true }
            })
            const authMode = config?.dealerAuthMode || "PASSWORD_ONLY"
            if (authMode !== "OTP_ONLY" && !password) {
                throw new RedeemError(400, "PASSWORD_REQUIRED")
            }
            let passwordHash = null
            if (password) {
                passwordHash = await hashPassword(password)
            }

            // 2. Resolve Company (reuse or create)
            // dealerCompanyId is already propagated from the invite if available
            if (!dealerCompanyId) {
                const existingCompany = taxNumber
                    ? await tx.dealerCompany.findFirst({ where: { taxNumber }, select: { id: true } })
                    : null

                if (existingCompany) {
                    dealerCompanyId = existingCompany.id
                } else {
                    const createdCompany = await tx.dealerCompany.create({
                        data: {
                            companyName: legalName,
                            taxNumber,
                            taxOffice,
                            address,
                            city,
                            district
                        },
                        select: { id: true },
                    })
                    dealerCompanyId = createdCompany.id
                }
            }

            // 3. Resolve DealerUser (invite-only logic)
            const existingUser = await tx.dealerUser.findFirst({
                where: { phone: phoneE164 },
                select: { id: true, defaultDealerCompanyId: true, passwordHash: true },
            })

            let dealerUserId: string

            if (existingUser) {
                dealerUserId = existingUser.id
            } else {
                if (!email) {
                    throw new RedeemError(400, "EMAIL_REQUIRED")
                }

                const createdUser = await tx.dealerUser.create({
                    data: {
                        email,
                        phone: phoneE164,
                        defaultDealerCompanyId: dealerCompanyId,
                        passwordHash
                    },
                    select: { id: true },
                })
                dealerUserId = createdUser.id
            }

            // 4. Create Membership locking user to supplier
            const membership = await tx.dealerMembership.upsert({
                where: {
                    dealerUserId_tenantId: {
                        dealerUserId: dealerUserId,
                        tenantId: supplierTenantId,
                    },
                },
                update: {
                    status: "ACTIVE",
                    dealerCompanyId: dealerCompanyId
                },
                create: {
                    dealerUserId: dealerUserId,
                    tenantId: supplierTenantId,
                    dealerCompanyId,
                    status: "ACTIVE",
                },
                select: { id: true, status: true },
            })

            // Ensure the user's default company is set
            await tx.dealerUser.update({
                where: { id: dealerUserId },
                data: {
                    defaultDealerCompanyId: dealerCompanyId,
                    ...(passwordHash && !existingUser?.passwordHash ? { passwordHash } : {})
                },
                select: { id: true }
            })

            // 5. Mark Invite as REDEEMED
            if (inviteId) {
                await tx.dealerInvite.update({
                    where: { id: inviteId },
                    data: {
                        status: "REDEEMED",
                        redeemedAt: new Date(),
                        redemptionCount: { increment: 1 },
                        dealerCompanyId,
                    },
                })
            }

            // --- 6. CREATE AUTO-Cari (Customer Card in headquarters) ---
            const supplierCompany = await tx.company.findFirst({
                where: { tenantId: supplierTenantId },
                orderBy: { createdAt: "asc" },
                select: { id: true }
            })

            if (supplierCompany) {
                // Check if customer already exists for this vergi No or phone
                const existingCustomer = await tx.customer.findFirst({
                    where: { 
                        companyId: supplierCompany.id,
                        OR: [
                            { taxNumber: taxNumber },
                            { phone: phoneE164 }
                        ]
                    },
                    select: { id: true }
                })
                if (!existingCustomer) {
                    // Kategori bul ("Genel" kategorisi)
                    let targetCategoryId = null;
                    const generalCat = await tx.customerCategory.findFirst({
                        where: { name: 'Genel', companyId: supplierCompany.id },
                        select: { id: true }
                    });
                    if (generalCat) targetCategoryId = generalCat.id;

                    await tx.customer.create({
                        data: {
                            companyId: supplierCompany.id,
                            ...(targetCategoryId ? { categoryId: targetCategoryId } : {}),
                            name: legalName,
                            email,
                            phone: phoneE164,
                            taxNumber,
                            taxOffice,
                            contactPerson,
                            iban,
                            address,
                            city,
                            district,
                            branch: "Merkez",
                            supplierClass: "B2B_DEALER",
                            customerClass: "B2B_BAYI",
                        }
                    })
                }
            }

            return { dealerUserId, dealerCompanyId, membershipId: membership.id }
        })

        return NextResponse.json({ ok: true, ...result })
    } catch (e: any) {
        if (e instanceof RedeemError) {
            return NextResponse.json({ ok: false, error: e.code }, { status: e.http })
        }
        console.error("[REDEEM_FAILED] Internal Error:", e);
        return NextResponse.json({ ok: false, error: "REDEEM_FAILED" }, { status: 500 })
    }
}

class RedeemError extends Error {
    constructor(public http: number, public code: string) {
        super(code)
    }
}
