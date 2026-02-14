import { PrismaClient } from "@prisma/client";

const globalForPrismaBase = globalThis as unknown as { prismaBase?: PrismaClient };

export const prismaBase =
    globalForPrismaBase.prismaBase ??
    new PrismaClient({
        log: ["error"],
    });

if (process.env.NODE_ENV !== "production") globalForPrismaBase.prismaBase = prismaBase;
