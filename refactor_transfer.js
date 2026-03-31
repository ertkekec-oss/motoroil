const fs = require('fs');

let content = fs.readFileSync('src/app/(app)/inventory/components/InventoryTransferModal.tsx', 'utf8');

if (!content.includes('EnterpriseInput')) {
  content = content.replace(
      "import { Product } from '@/contexts/AppContext';",
      "import { Product } from '@/contexts/AppContext';\nimport { EnterpriseInput, EnterpriseSelect, EnterpriseButton } from '@/components/ui/enterprise';"
  );
}

// Selects
content = content.replace(
    /<select\s+className="w-full bg-white dark:bg-\[#1e293b\] p-3[^"]*"\s+value=\{transferData\.productId\}\s+onChange=\{e => setTransferData\(\{ \.\.\.transferData, productId: parseInt\(e\.target\.value\) \}\)\}\s*>([\s\S]*?)<\/select>/g,
    '<EnterpriseSelect value={transferData.productId} onChange={e => setTransferData({ ...transferData, productId: parseInt(e.target.value) || 0 })}>\n$1\n                        </EnterpriseSelect>'
);

content = content.replace(
    /<select\s+className="w-full h-\[46px\] bg-white dark:bg-\[#1e293b\] px-4[^"]*"\s+value=\{transferData\.to\}\s+onChange=\{e => setTransferData\(\{ \.\.\.transferData, to: e\.target\.value \}\)\}\s*>([\s\S]*?)<\/select>/g,
    '<EnterpriseSelect value={transferData.to} onChange={e => setTransferData({ ...transferData, to: e.target.value })}>\n$1\n                        </EnterpriseSelect>'
);

// Input
content = content.replace(
    /<div className="relative">\s*<input\s+type="number"\s+className="w-full bg-white dark:bg-\[#1e293b\] py-5 px-6 text-\[32px\][^"]*"\s+value=\{transferData\.qty \|\| ''\}\s+onChange=\{e => setTransferData\(\{ \.\.\.transferData, qty: parseInt\(e\.target\.value\) \|\| 0 \}\)\}\s+placeholder="0"\s*\/>\s*<div className="absolute right-6 top-1\/2[^"]*">ADET<\/div>\s*<\/div>/g,
    '<EnterpriseInput type="number" value={transferData.qty || \'\'} onChange={e => setTransferData({ ...transferData, qty: parseInt(e.target.value) || 0 })} placeholder="0" className="text-center font-black text-[24px]" />'
);

// Labels can be wrapped in EnterpriseField, but for simplicity let's leave them if we didn't use EnterpriseField explicitly.
// Or we can just leave the div wrappers.

// Buttons
content = content.replace(
    /<button\s+className="w-full bg-indigo-600 hover:bg-indigo-700 text-white[^"]*"\s+onClick=\{handleSubmit\}\s+disabled=\{isProcessing \|\| !transferData\.productId \|\| transferData\.qty <= 0\}\s*>\s*\{isProcessing \? 'İŞLENİYOR\.\.\.' : \(isSystemAdmin \? 'TRANSFERİ TAMAMLA' : 'ONAY TALEBİ GÖNDER'\)\}\s*<\/button>/g,
    '<EnterpriseButton className="w-full h-14" onClick={handleSubmit} disabled={isProcessing || !transferData.productId || transferData.qty <= 0}>\n                        {isProcessing ? \'İŞLENİYOR...\' : (isSystemAdmin ? \'TRANSFERİ TAMAMLA\' : \'ONAY TALEBİ GÖNDER\')}\n                    </EnterpriseButton>'
);

content = content.replace(
    /<button\s+className="w-full py-3 text-\[12px\] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"\s+onClick=\{onClose\}\s+disabled=\{isProcessing\}\s*>\s*İptal Et\s*<\/button>/g,
    '<EnterpriseButton variant="secondary" className="w-full" onClick={onClose} disabled={isProcessing}>\n                        İptal Et\n                    </EnterpriseButton>'
);

content = content.replace(
    /<button onClick=\{onClose\} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 relative z-10 border border-slate-200 dark:border-slate-700">\s*<svg[^>]*>\s*<path[^>]*\/>\s*<\/svg>\s*<\/button>/g,
    '<button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 flex items-center justify-center dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-400 font-medium">✕</button>'
);


fs.writeFileSync('src/app/(app)/inventory/components/InventoryTransferModal.tsx', content);
