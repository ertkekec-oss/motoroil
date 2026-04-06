const fs = require('fs');

let c = fs.readFileSync('src/components/AdminSidebar.tsx', 'utf8');

// 1. Remove old Mail settings link (lines 516-520 usually)
c = c.replace(/<NavItem\s*\n\s*href="\/admin\/settings\/mail"\s*\n\s*icon=\{Mail\}\s*\n\s*label="Mail Ayarları \(Global\)"\s*\n\s*\/>/g, '');

// 2. Remove old Signatures providers link
c = c.replace(/<NavItem\s*\n\s*href="\/admin\/signatures\/providers"\s*\n\s*icon=\{Server\}\s*\n\s*label="Sağlayıcılar"\s*\n\s*\/>/g, '');

// 3. Remove old Escrow Providers link
c = c.replace(/<NavItem\s*\n\s*href="\/admin\/payments-escrow\/providers"\s*\n\s*icon=\{CreditCard\}\s*\n\s*label="Ödeme Sağlayıcıları"\s*\n\s*\/>/g, '');

// 4. Remove the Hub buried Integrations link 
c = c.replace(/<NavItem\s*\n\s*href="\/admin\/integrations"\s*\n\s*icon=\{Server\}\s*\n\s*label="Entegrasyon Merkezi \(Yeni\)"\s*\n\s*\/>/g, '');


// 5. Add NEW ROOT CATEGORY after WEBSITE & IÇERIK
const targetStr = `        {isSuper && (
          <NavGroup
            title="WEBSİTE & İÇERİK"
            icon={Library}
            groupKey="website_main"
          >
            <NavItem
              href="/admin/website"
              icon={LayoutDashboard}
              label="Websitesi Yöneticisi"
            />
          </NavGroup>
        )}
      </div>`;

const insertion = `
      {/* 3. PARTİ YAZILIMLAR */}
      {isSuper && (
        <div className="space-y-1 mb-6">
          <div className="px-3 mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            3. PARTİ YAZILIMLAR & APİ
            <Zap className="w-4 h-4 text-indigo-500" />
          </div>
          <NavItem href="/admin/integrations" icon={Network} label="Entegrasyon Merkezi (Hub)" />
        </div>
      )}
`;

if (c.includes(targetStr)) {
    c = c.replace(targetStr, targetStr + insertion);
    console.log("Successfully injected root category");
} else {
    console.log("FAILED to find insertion point");
}

fs.writeFileSync('src/components/AdminSidebar.tsx', c, 'utf8');
