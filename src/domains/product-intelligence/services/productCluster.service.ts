import prisma from "@/lib/prisma";
import { normalizeProductName } from "../utils/productNormalization";
import { extractNumericTokens } from "../utils/productTokenization";

export function buildClusterKey(input: string): string {
    const norm = normalizeProductName(input);
    const nums = extractNumericTokens(input).join('-');
    // cluster key uses normalized alpha and numeric parts to group
    return `${norm}_${nums}`;
}

export async function findOrCreateClusterForCanonical(canonicalProductId: string): Promise<any> {
    const canonical = await prisma.canonicalProduct.findUnique({
        where: { id: canonicalProductId },
    });

    if (!canonical) throw new Error("Canonical Product not found");

    const clusterKey = buildClusterKey(canonical.name);

    let cluster = await prisma.productCluster.findFirst({
        where: { canonicalProductId },
    });

    if (!cluster) {
        cluster = await prisma.productCluster.create({
            data: {
                canonicalProductId,
                clusterKey,
                confidenceScore: 1.0,
            },
        });
    }

    return cluster;
}

export async function assignSimilarityToCluster(similarityId: string, clusterId: string) {
    return prisma.productSimilarity.update({
        where: { id: similarityId },
        data: { clusterId },
    });
}

export async function rebuildCanonicalProductCluster(canonicalProductId: string) {
    // Finds similarities bound to this canonical and forces their clusterId to canonical's cluster
    const cluster = await findOrCreateClusterForCanonical(canonicalProductId);

    await prisma.productSimilarity.updateMany({
        where: { canonicalProductId },
        data: { clusterId: cluster.id },
    });

    return cluster;
}
