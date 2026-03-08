import prisma from "@/lib/prisma";

export async function createCompanyIdentity(data: {
    tenantId: string;
    legalName: string;
    taxNumber: string;
    tradeRegistryNo?: string;
    country: string;
    city?: string;
    address?: string;
    website?: string;
    phone?: string;
}) {
    return prisma.companyIdentity.create({
        data: {
            ...data,
            verificationStatus: "UNVERIFIED",
        },
    });
}

export async function updateCompanyIdentity(tenantId: string, data: Partial<{
    legalName: string;
    taxNumber: string;
    tradeRegistryNo: string;
    country: string;
    city: string;
    address: string;
    website: string;
    phone: string;
    verificationStatus: string;
}>) {
    return prisma.companyIdentity.update({
        where: { tenantId },
        data,
    });
}

export async function getCompanyIdentity(tenantId: string) {
    return prisma.companyIdentity.findUnique({
        where: { tenantId },
        include: {
            documents: true,
        },
    });
}

export async function submitVerificationDocument(data: {
    companyId: string;
    documentType: string;
    documentUrl: string;
}) {
    const doc = await prisma.companyVerificationDocument.create({
        data: {
            ...data,
            status: "PENDING",
        },
    });

    // Automatically switch status to PENDING if it was UNVERIFIED
    const company = await prisma.companyIdentity.findUnique({ where: { id: data.companyId } });
    if (company && company.verificationStatus === "UNVERIFIED") {
        await prisma.companyIdentity.update({
            where: { id: data.companyId },
            data: { verificationStatus: "PENDING" }
        });
    }

    return doc;
}

export async function updateVerificationStatus(companyId: string, status: "VERIFIED" | "REJECTED") {
    return prisma.companyIdentity.update({
        where: { id: companyId },
        data: { verificationStatus: status },
    });
}

export async function listCompaniesForVerification() {
    return prisma.companyIdentity.findMany({
        where: {
            verificationStatus: { in: ["PENDING", "UNVERIFIED", "VERIFIED", "REJECTED"] }
        },
        include: {
            documents: true,
        },
        orderBy: { createdAt: "desc" },
    });
}
