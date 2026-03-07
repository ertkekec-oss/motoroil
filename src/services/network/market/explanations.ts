import { NetworkMarketSignalType } from '@prisma/client';

export function explainMarketSignal(signalType: NetworkMarketSignalType, args: any) {
    const defaultData = {
        topDrivers: [],
        supportingMetrics: [],
        confidenceReasons: [],
        riskFlags: [],
        suggestedActions: [],
        affectedScope: args.scope || 'GLOBAL'
    };

    switch (signalType) {
        case 'DEMAND_SPIKE':
            return {
                ...defaultData,
                userFriendlyExplanation: `Bu kategoride son dönemde talep artışı tespit edildi. ${args.details || ''}`,
                topDrivers: ['Yüksek RFQ hacmi', 'Azalan aktif stok yoğunluğu']
            };
        case 'SUPPLY_SHORTAGE':
            return {
                ...defaultData,
                userFriendlyExplanation: `Arz daralması yaşanıyor. Yeni tedarik kaynaklarına ihtiyaç duyulabilir.`,
                riskFlags: ['Düşük aktif tedarikçi sayısı', 'Kapasite sınırına yakınlık']
            };
        default:
            return { ...defaultData, userFriendlyExplanation: 'Sistem tabanlı pazar sinyali.' };
    }
}

export function explainTenantInsight(insightType: string, args: any) {
    return {
        userFriendlyExplanation: `Tenant ağındaki değişimlere dayalı öneri. ${args.details || ''}`,
        suggestedActions: [args.action || 'WAIT_AND_MONITOR']
    };
}
