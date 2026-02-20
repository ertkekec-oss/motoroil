import { MarketplaceActionProvider } from "./types";
import { TrendyolActionProvider } from "./providers/trendyol-actions";
import { PazaramaActionProvider } from "./providers/pazarama-actions";
import { HepsiburadaActionProvider } from "./providers/hepsiburada-actions";
import { N11ActionProvider } from "./providers/n11-actions";

export class ActionProviderRegistry {
    static getProvider(marketplace: string): MarketplaceActionProvider {
        const normalized = marketplace.toLowerCase();

        switch (normalized) {
            case "trendyol":
                return new TrendyolActionProvider();
            case "pazarama":
                return new PazaramaActionProvider();
            case "hepsiburada":
                return new HepsiburadaActionProvider();
            case "n11":
                return new N11ActionProvider();
            default:
                throw new Error(`Marketplace provider not found for: ${marketplace}`);
        }
    }
}
