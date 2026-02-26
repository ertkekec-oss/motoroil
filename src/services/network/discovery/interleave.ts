import { DiscoveryResultItem } from './types';

export function interleaveListingResults(
    scoredItems: { item: DiscoveryResultItem; scoreDesc: number; rawId: string }[],
    limit: number
): DiscoveryResultItem[] {
    const sponsoredCandidates = scoredItems.filter(x => x.item.isSponsored);
    const organicCandidates = scoredItems.filter(x => !x.item.isSponsored);

    // Keep internal sorting (they are already sorted by scoreDesc then rawId desc handled upstream)
    // Actually, sorting is deterministic upstream. We just preserve list order.

    const maxSponsored = Math.floor(limit * 0.20);
    const finalResult: DiscoveryResultItem[] = [];

    let sIndex = 0;
    let oIndex = 0;

    let totalSponsoredAdded = 0;

    while (finalResult.length < limit && (sIndex < sponsoredCandidates.length || oIndex < organicCandidates.length)) {
        // Interleave pattern: 1 sponsored every 4 organic
        // That means index 0 is sponsored, then 1,2,3,4 organic, then 5 is sponsored.
        // Wait, 1 sponsored every 4 organically -> slots: [S, O, O, O, O, S, O, O, O, O ... ]

        const isSponsoredSlot = (finalResult.length % 5 === 0);

        if (isSponsoredSlot && sIndex < sponsoredCandidates.length && totalSponsoredAdded < maxSponsored) {
            finalResult.push(sponsoredCandidates[sIndex].item);
            sIndex++;
            totalSponsoredAdded++;
        } else if (oIndex < organicCandidates.length) {
            finalResult.push(organicCandidates[oIndex].item);
            oIndex++;
        } else if (sIndex < sponsoredCandidates.length && totalSponsoredAdded < maxSponsored) {
            // No more organics, but still have sponsored quota
            finalResult.push(sponsoredCandidates[sIndex].item);
            sIndex++;
            totalSponsoredAdded++;
        } else {
            // Fill remaining with organics if no sponsored available or cap reached
            if (oIndex < organicCandidates.length) {
                finalResult.push(organicCandidates[oIndex].item);
                oIndex++;
            } else if (sIndex < sponsoredCandidates.length && totalSponsoredAdded < Math.floor(limit * 0.50)) {
                // Exceptional case, limit relaxation if required, but strict cap says maxSponsored.
                break;
            } else {
                break;
            }
        }
    }

    return finalResult;
}
