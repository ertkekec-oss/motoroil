export async function markSignalsStaleByVersion(modelDelegate: any, currentVersion: number) {
    return modelDelegate.updateMany({
        where: { calculationVersion: { lt: currentVersion }, status: 'ACTIVE' },
        data: { status: 'STALE', isStale: true }
    });
}
