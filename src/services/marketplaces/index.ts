import { IMarketplaceService, MarketplaceConfig, TrendyolConfig, HepsiburadaConfig, N11Config, PazaramaConfig } from './types';
import { TrendyolService } from './trendyol';
import { HepsiburadaService } from './hepsiburada';
import { N11Service } from './n11';
import { PazaramaService } from './pazarama';

export class MarketplaceServiceFactory {
    static createService(marketplaceType: 'trendyol' | 'hepsiburada' | 'n11' | 'amazon' | 'pazarama', config: any): IMarketplaceService {
        switch (marketplaceType) {
            case 'trendyol':
                return new TrendyolService(config as TrendyolConfig);
            case 'hepsiburada':
                return new HepsiburadaService(config as HepsiburadaConfig);
            case 'n11':
                return new N11Service(config as N11Config);
            case 'pazarama':
                return new PazaramaService(config as PazaramaConfig);
            case 'amazon':
                throw new Error('Amazon entegrasyonu henüz aktif değil.');
            default:
                throw new Error(`Geçersiz pazaryeri tipi: ${marketplaceType}`);
        }
    }
}

export * from './types';
export * from './trendyol';
export * from './hepsiburada';
export * from './n11';
export * from './pazarama';
