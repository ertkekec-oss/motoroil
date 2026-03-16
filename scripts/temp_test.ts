import { execSync } from 'child_process';
try {
  execSync('npx tsc --noEmit src/app/api/financials/transactions/route.ts', { stdio: 'inherit' });
  console.log("No syntax errors found!");
} catch (e) {
  console.log("Syntax error!");
}
