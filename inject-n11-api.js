const fs = require('fs');
const fileStr = fs.readFileSync('src/services/marketplaces/n11.ts', 'utf8');

const injectionCode = `
    async getOrderSettlements(orderNumber: string): Promise<any[]> {
        try {
            // N11 Settlement / Finans endpoint
            // N11 SOA/REST API typically uses a search settlement approach.
            const result = await this.makeRequest('settlements', {
                orderNumber: orderNumber,
                page: '0',
                size: '100'
            });
            return result?.content || [];
        } catch (error: any) {
            console.warn(\`[N11_SETTLEMENT_WARN] \${orderNumber}: \${error.message}\`);
            return [];
        }
    }

    async getOrderDeductions(orderNumber: string): Promise<any[]> {
        try {
            // N11 Cargo/Deduction endpoint
            const result = await this.makeRequest('deductions', {
                orderNumber: orderNumber,
                page: '0',
                size: '100'
            });
            return result?.content || [];
        } catch (error: any) {
            console.warn(\`[N11_DEDUCTION_WARN] \${orderNumber}: \${error.message}\`);
            return [];
        }
    }
`;

if (!fileStr.includes('getOrderSettlements(')) {
    const updated = fileStr.replace(
        'async getOrders(startDate?: Date, endDate?: Date): Promise<MarketplaceOrder[]> {',
        injectionCode + '\n    async getOrders(startDate?: Date, endDate?: Date): Promise<MarketplaceOrder[]> {'
    );
    fs.writeFileSync('src/services/marketplaces/n11.ts', updated, 'utf8');
}
