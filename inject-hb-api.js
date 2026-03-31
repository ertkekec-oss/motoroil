const fs = require('fs');
const fileStr = fs.readFileSync('src/services/marketplaces/hepsiburada.ts', 'utf8');

const injectionCode = `
    async getOrderSettlements(orderNumber: string): Promise<any[]> {
        try {
            // Hepsiburada Settlement API endpoint details may vary by integration version.
            // Typically: GET https://mpop-api.hepsiburada.com/finances/settlements?orderNumber={orderNumber}
            const merchantId = (this.config.merchantId || '').trim();
            const url = \`\${this.baseUrl.replace('oms-external', 'mpop-api')}/finances/settlements?orderuid=\${encodeURIComponent(orderNumber)}&merchantId=\${merchantId}\`;
            const fetchUrl = this.getFetchUrl(url);
            
            const response = await this.safeFetchJson(fetchUrl, { headers: this.getHeaders() });
            
            // Adapter translation: map Hepsiburada's schema to our expected standard schema internally if needed,
            // or just return the raw array.
            return response.data?.transactions || response.data?.content || [];
        } catch (error: any) {
            console.warn(\`[HB_SETTLEMENT_WARN] \${orderNumber}: \${error.message}\`);
            return []; // Graceful fallback
        }
    }

    async getOrderDeductions(orderNumber: string): Promise<any[]> {
        try {
            // Hepsiburada Cargo/Deduction API endpoint
            const merchantId = (this.config.merchantId || '').trim();
            const url = \`\${this.baseUrl.replace('oms-external', 'mpop-api')}/finances/deductions?orderuid=\${encodeURIComponent(orderNumber)}&merchantId=\${merchantId}\`;
            const fetchUrl = this.getFetchUrl(url);
            
            const response = await this.safeFetchJson(fetchUrl, { headers: this.getHeaders() });
            return response.data?.transactions || response.data?.content || [];
        } catch (error: any) {
            console.warn(\`[HB_DEDUCTION_WARN] \${orderNumber}: \${error.message}\`);
            return [];
        }
    }
`;

if (!fileStr.includes('getOrderSettlements(')) {
    const updated = fileStr.replace(
        'async getOrders(startDate?: Date, endDate?: Date): Promise<MarketplaceOrder[]> {',
        injectionCode + '\n    async getOrders(startDate?: Date, endDate?: Date): Promise<MarketplaceOrder[]> {'
    );
    fs.writeFileSync('src/services/marketplaces/hepsiburada.ts', updated, 'utf8');
}
