const fs = require('fs');
const path = require('path');

const modules = {
    'customers': 'CRM',
    'inventory': 'INVENTORY',
    'sales': 'SALES',
    'purchasing': 'PURCHASING',
    'accounting': 'ACCOUNTING',
    'treasury': 'TREASURY',
    'invoices': 'EFATURA',
    'reports': 'REPORTS',
    'field-sales': 'FIELD_SALES',
    'kitchen': 'KDS',
    'fintech': 'FINTECH',
    'assets': 'ASSETS',
    'advisor': 'ADVISOR'
};

const baseDir = path.join(__dirname, 'src/app/(app)');

for (const [folder, maxLen] of Object.entries(modules)) {
    const layoutPath = path.join(baseDir, folder, 'layout.tsx');
    if (!fs.existsSync(layoutPath)) {
        const content = `"use client";

import ModuleGatekeeper from "@/components/ModuleGatekeeper";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <ModuleGatekeeper moduleId="${maxLen}">
            {children}
        </ModuleGatekeeper>
    );
}`;
        fs.writeFileSync(layoutPath, content);
        console.log(`Created layout.tsx for ${folder} -> ${maxLen}`);
    } else {
        console.log(`Layout already exists for ${folder}. Please handle manually.`);
    }
}
