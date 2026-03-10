import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

async function checkIndexes() {
    console.log("=== DB PROFILING & INDEX AUDIT ===");
    console.log("Starting static Prisma schema analysis...\n");

    const fs = require('fs');
    if (!fs.existsSync('prisma/schema.prisma')) {
        console.error("schema.prisma not found");
        return;
    }

    const schema = fs.readFileSync('prisma/schema.prisma', 'utf-8');
    const models = schema.match(/model \w+ {[^}]*}/g) || [];

    const criticalModels = ['Customer', 'Product', 'Invoice', 'StockMovement', 'NetworkTradeProposal', 'NetworkTradeLedger', 'SupportTicket'];
    let warningCount = 0;

    models.forEach(modelStr => {
        const modelNameMatch = modelStr.match(/model (\w+)/);
        if (!modelNameMatch) return;
        const modelName = modelNameMatch[1];
        
        if (!criticalModels.includes(modelName)) return;

        console.log(`\nModel: ${modelName}`);
        
        const hasTenantId = modelStr.includes('tenantId String');
        
        if (hasTenantId) {
            const hasIndexTenantId = modelStr.includes('@@index([tenantId])') || modelStr.includes('@@unique([tenantId,');
            const hasCompoundTenantStatus = modelStr.includes('@@index([tenantId, status])');
            const hasCompoundTenantCreated = modelStr.includes('@@index([tenantId, createdAt])');
            const hasCompoundTenantCategory = modelStr.includes('@@index([tenantId, categoryId])') || modelStr.includes('@@index([tenantId, category])');

            console.log(`  - TenantId field: Found`);
            console.log(`  - @@index([tenantId]): ${hasIndexTenantId ? '✅' : '❌'}`);
            
            if (modelStr.includes('status ')) {
                console.log(`  - @@index([tenantId, status]): ${hasCompoundTenantStatus ? '✅' : '❌ WARNING'}`);
                if (!hasCompoundTenantStatus) warningCount++;
            }
            if (modelStr.includes('createdAt ')) {
                console.log(`  - @@index([tenantId, createdAt]): ${hasCompoundTenantCreated ? '✅' : '❌ WARNING (Order By risk)'}`);
                if (!hasCompoundTenantCreated) warningCount++;
            }
            if (modelStr.includes('categoryId ') || modelStr.includes('category ')) {
                console.log(`  - @@index([tenantId, category]): ${hasCompoundTenantCategory ? '✅' : '❌ WARNING'}`);
            }
        }
    });

    console.log(`\n✅ Profiling complete. Found ${warningCount} missing compound indexes on critical large scale tables.`);
}

checkIndexes().catch(console.error);
