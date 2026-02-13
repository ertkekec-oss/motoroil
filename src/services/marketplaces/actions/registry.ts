import { initMarketplaceWorker } from "@/lib/queue/worker-init";
import { MarketplaceActionProvider } from "./types";
import { TrendyolActionProvider } from "./providers/trendyol-actions";

export class ActionProviderRegistry {
    static getProvider(marketplace: string): MarketplaceActionProvider {
        initMarketplaceWorker(); // Ensure worker is listening
        const normalized = marketplace.toLowerCase();

        switch (normalized) {
            case "trendyol":
                return new TrendyolActionProvider();
            default:
                throw new Error(`Marketplace provider not found for: ${marketplace}`);
        }
    }
}
