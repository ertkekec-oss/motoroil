const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let prismaQueriesWithoutTenant = 0;
let totalPrismaQueries = 0;
let filesWithIssues = new Set();

walkDir(path.join(process.cwd(), 'src/app/api'), function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for generic prisma.XXX.findMany, findUnique, findFirst, update, create, delete, count
    // This regex is very basic but will catch most standard prisma calls.
    const prismaRegex = /prisma\.[a-zA-Z0-9_]+\.(?:findMany|findUnique|findFirst|update|updateMany|delete|deleteMany|count)\s*\(\s*\{([^]*?)\}\s*\)/g;
    
    let match;
    while ((match = prismaRegex.exec(content)) !== null) {
      totalPrismaQueries++;
      const queryBody = match[1];
      // Check if it has 'tenantId' or variable commonly used for tenant isolation like 'whereClause'
      if (!queryBody.includes('tenantId') && !queryBody.includes('whereClause') && !queryBody.includes('session.companyId') && !queryBody.includes('companyId')) {
         prismaQueriesWithoutTenant++;
         filesWithIssues.add(filePath.replace(process.cwd(), ''));
      }
    }
  }
});

console.log('Total Prisma Queries found: ' + totalPrismaQueries);
console.log('Queries potentially missing tenant isolation: ' + prismaQueriesWithoutTenant);
if (filesWithIssues.size > 0) {
    console.log('Files with potential isolation issues:', Array.from(filesWithIssues).slice(0, 10));
}
