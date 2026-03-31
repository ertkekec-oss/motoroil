import fs from 'fs';

const fileStr = fs.readFileSync('src/services/marketplaces/trendyol.ts', 'utf8');

const injectionCode = `
    async getOrderSettlements(orderNumber: string): Promise<any[]> {
        try {
            const url = \`\${this.baseUrl}/integration/finance/cheques/v1/settlements?transactionType=Sale&orderNumber=\${encodeURIComponent(orderNumber)}\`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? \`\${effectiveProxy}?url=\${encodeURIComponent(url)}\` : url;
            const response = await this.safeFetchJson(fetchUrl, { headers: this.getHeaders() });
            return response.data?.content || [];
        } catch (error) {
             console.error(\`Trendyol getOrderSettlements failed for \${orderNumber}:\`, error);
             return [];
        }
    }

    async getOrderDeductions(orderNumber: string): Promise<any[]> {
        try {
            // Fetch any other penalties, early payout interest, refund deductions etc for this order
            const url = \`\${this.baseUrl}/integration/finance/cheques/v1/other-financial-deductions?orderNumber=\${encodeURIComponent(orderNumber)}\`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? \`\${effectiveProxy}?url=\${encodeURIComponent(url)}\` : url;
            const response = await this.safeFetchJson(fetchUrl, { headers: this.getHeaders() });
            return response.data?.content || [];
        } catch (error) {
             return [];
        }
    }
`;

if (!fileStr.includes('getOrderSettlements(')) {
    const updated = fileStr.replace(
        'async getOrders(startDate?: Date, endDate?: Date): Promise<MarketplaceOrder[]> {',
        injectionCode + '\n    async getOrders(startDate?: Date, endDate?: Date): Promise<MarketplaceOrder[]> {'
    );
    fs.writeFileSync('src/services/marketplaces/trendyol.ts', updated, 'utf8');
}
