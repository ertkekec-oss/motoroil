const fs = require('fs');
const path = require('path');

// 1. Delete old_page.tsx
if (fs.existsSync('old_page.tsx')) fs.unlinkSync('old_page.tsx');
if (fs.existsSync('old_page_utf8.tsx')) fs.unlinkSync('old_page_utf8.tsx');

// 2. Fix admin/b2b/settings/page.tsx
const b2bFile = 'src/app/(app)/admin/b2b/settings/page.tsx';
if (fs.existsSync(b2bFile)) {
    let text = fs.readFileSync(b2bFile, 'utf8');
    text = text.replace(/padding=".*?"/g, '');
    fs.writeFileSync(b2bFile, text);
}

// 3. Fix admin/growth/audit/page.tsx
const auditFile = 'src/app/(app)/admin/growth/audit/page.tsx';
if (fs.existsSync(auditFile)) {
    let text = fs.readFileSync(auditFile, 'utf8');
    text = text.replace(/titleIcon=\{.*?\}/g, '');
    text = text.replace(/padding=".*?"/g, '');
    fs.writeFileSync(auditFile, text);
}

// 4. Fix admin/settings/categories/page.tsx
const catFile = 'src/app/(app)/admin/settings/categories/page.tsx';
if (fs.existsSync(catFile)) {
    let text = fs.readFileSync(catFile, 'utf8');
    text = text.replace(/className="[^"]*border-b[^"]*"/g, '');
    fs.writeFileSync(catFile, text);
}

// 5. Fix admin/settings/onboarding/page.tsx
const onboardFile = 'src/app/(app)/admin/settings/onboarding/page.tsx';
if (fs.existsSync(onboardFile)) {
    let text = fs.readFileSync(onboardFile, 'utf8');
    text = text.replace(/className="[^"]*border-b[^"]*"/g, '');
    fs.writeFileSync(onboardFile, text);
}

// 6. Fix customers/[id]/CustomerDetailClient.tsx
const custFile = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
if (fs.existsSync(custFile)) {
    let text = fs.readFileSync(custFile, 'utf8');
    text = text.replace(/activeTab === 'reconciliation'/g, "activeTab === 'reconciliations'");
    fs.writeFileSync(custFile, text);
}

// 7. Fix inventory/page.tsx
const invFile = 'src/app/(app)/inventory/page.tsx';
if (fs.existsSync(invFile)) {
    let text = fs.readFileSync(invFile, 'utf8');
    text = text.replace(/onRunAiMap=\{.*?\}\s*/g, '');
    fs.writeFileSync(invFile, text);
}

// 8. Fix signatures/envelopes/[id]/EnvelopeDetailClient.tsx
const envFile = 'src/app/(app)/signatures/envelopes/[id]/EnvelopeDetailClient.tsx';
if (fs.existsSync(envFile)) {
    let text = fs.readFileSync(envFile, 'utf8');
    if (!text.includes('Clock,')) {
        text = text.replace(/import\s*\{(.*?)\}\s*from\s*"lucide-react"/, 'import {$1, Clock} from "lucide-react"');
    }
    fs.writeFileSync(envFile, text);
}

// 9. Fix api/suppliers/[id]/invoice/parse/route.ts
const parseFile = 'src/app/api/suppliers/[id]/invoice/parse/route.ts';
if (fs.existsSync(parseFile)) {
    let text = fs.readFileSync(parseFile, 'utf8');
    text = text.replace(/pdfParse\.default/g, 'pdfParse');
    fs.writeFileSync(parseFile, text);
}

// 10. Fix OnlineOrdersTab.tsx
const salesFile = 'src/components/sales/OnlineOrdersTab.tsx';
if (fs.existsSync(salesFile)) {
    let text = fs.readFileSync(salesFile, 'utf8');
    if (!text.includes('CheckCircle2')) {
        text = text.replace(/import\s*\{(.*?)\}\s*from\s*['"]lucide-react['"]/, 'import {$1, CheckCircle2} from "lucide-react"');
    }
    fs.writeFileSync(salesFile, text);
}

console.log("TS Fixes applied.");
