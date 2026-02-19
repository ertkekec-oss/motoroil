import { MarketplaceActionProvider } from "./types";
import { TrendyolActionProvider } from "./providers/trendyol-actions";
import { PazaramaActionProvider } from "./providers/pazarama-actions";

export class ActionProviderRegistry {
    static getProvider(marketplace: string): MarketplaceActionProvider {
        const normalized = marketplace.toLowerCase();

        switch (normalized) {
            case "trendyol":
                return new TrendyolActionProvider();
            case "pazarama":
                return new PazaramaActionProvider();
            default:
                throw new Error(`Marketplace provider not found for: ${marketplace}`);
        }
    }
}
