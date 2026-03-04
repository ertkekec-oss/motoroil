const fs = require('fs');
const path = require('path');

const pages = [
    '/admin/security-kit',
    '/admin/tenants',
    '/admin/saas-plans',
    '/admin/hub/growth/boost',
    '/admin/hub/growth/trust-score',
    '/admin/hub/growth/campaigns',
    '/admin/hub/risk/credit',
    '/admin/hub/risk/escrow',
    '/admin/hub/risk/abuse',
    '/admin/hub/network/categories',
    '/admin/hub/network/commissions',
    '/admin/hub/network/brands',
    '/admin/hub/infra/gateways',
    '/admin/hub/infra/fintech',
    '/admin/hub/infra/limits'
];

const basePath = path.join(process.cwd(), 'src', 'app', '(app)');

pages.forEach(p => {
    const fullDir = path.join(basePath, p);
    fs.mkdirSync(fullDir, { recursive: true });
    let componentName = p.split('/').pop();
    componentName = componentName.replace(/-./g, x => x[1].toUpperCase());
    componentName = componentName.charAt(0).toUpperCase() + componentName.slice(1);

    const content = `"use client";
import { EnterprisePageShell } from "@/components/ui/enterprise";

export default function ${componentName}Page() {
    return (
        <EnterprisePageShell title="Hazırlanıyor" description="Bu modül yapım aşamasındadır.">
            <div className="p-8 text-center text-slate-500">Çok yakında...</div>
        </EnterprisePageShell>
    );
}`;
    fs.writeFileSync(path.join(fullDir, 'page.tsx'), content);
});

console.log('Pages created successfully.');
