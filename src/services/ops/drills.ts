import { prisma } from "@/lib/prisma";

export async function createDrillRun(data: {
    date: Date;
    rtoMinutes?: number;
    rpoMinutes?: number;
    status: 'PASSED' | 'FAILED' | 'NEEDS_IMPROVEMENT';
    detailsJson: any;
    createdBy?: string;
}) {
    return prisma.opsDrillRun.create({
        data: {
            date: data.date,
            rtoMinutes: data.rtoMinutes,
            rpoMinutes: data.rpoMinutes,
            status: data.status,
            detailsJson: data.detailsJson,
            createdBy: data.createdBy
        }
    });
}

export async function getDrillRuns() {
    return prisma.opsDrillRun.findMany({
        orderBy: { date: 'desc' },
        take: 20
    });
}
