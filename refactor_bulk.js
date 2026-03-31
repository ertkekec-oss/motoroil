const fs = require('fs');

let content = fs.readFileSync('src/app/(app)/inventory/components/InventoryBulkEditModal.tsx', 'utf8');

if (!content.includes('EnterpriseInput')) {
  content = content.replace(
      "import { Product } from '@/contexts/AppContext';",
      "import { Product } from '@/contexts/AppContext';\nimport { EnterpriseInput, EnterpriseSelect, EnterpriseButton } from '@/components/ui/enterprise';"
  );
}

// category mode select
content = content.replace(
    /<select\s+className="w-full bg-slate-50[^"]*"\s+onChange=\{\(e\) => setBulkValues\(\{ category: e\.target\.value \}\)\}\s*>([\s\S]*?)<\/select>/g,
    '<EnterpriseSelect onChange={(e) => setBulkValues({ category: e.target.value })}>\n$1\n                                </EnterpriseSelect>'
);

// vat mode inputs
content = content.replace(
    /<input\s+type="number"\s+placeholder="20"\s+className="w-full bg-slate-50[^"]*"\s+onChange=\{e => setBulkValues\(\{ \.\.\.bulkValues, salesVat: parseInt\(e\.target\.value\) \}\)\}\s*\/>/g,
    '<EnterpriseInput type="number" placeholder="20" onChange={e => setBulkValues({ ...bulkValues, salesVat: parseInt(e.target.value) })} />'
);

content = content.replace(
    /<input\s+type="number"\s+placeholder="20"\s+className="w-full bg-slate-50[^"]*"\s+onChange=\{e => setBulkValues\(\{ \.\.\.bulkValues, purchaseVat: parseInt\(e\.target\.value\) \}\)\}\s*\/>/g,
    '<EnterpriseInput type="number" placeholder="20" onChange={e => setBulkValues({ ...bulkValues, purchaseVat: parseInt(e.target.value) })} />'
);

// barcode mode inputs
content = content.replace(
    /<input\s+type="text"\s+placeholder="Barkodu okutun\.\.\."\s+defaultValue=\{product\.barcode\}\s+onChange=\{\(e\) => setBulkValues\(\{ \.\.\.bulkValues, \[product\.id\]: e\.target\.value \}\)\}\s+autoFocus=\{selectedIds\[0\] === product\.id\}\s+className="[^"]*"\s*\/>/g,
    '<EnterpriseInput placeholder="Barkodu okutun..." defaultValue={product.barcode} onChange={(e) => setBulkValues({ ...bulkValues, [product.id]: e.target.value })} autoFocus={selectedIds[0] === product.id} />'
);

// price mode generic inputs
content = content.replace(
    /<input\s+type="number"\s+placeholder="0"\s+value=\{adjValue \|\| ''\}\s+onChange=\{e => setAdjValue\(parseFloat\(e\.target\.value\) \|\| 0\)\}\s+className="[^"]*w-20[^"]*"\s*\/>/g,
    '<EnterpriseInput type="number" placeholder="0" value={adjValue || \'\'} onChange={e => setAdjValue(parseFloat(e.target.value) || 0)} className="w-24" />'
);

content = content.replace(
    /<input\s+type="number"\s+className="w-full bg-white[^"]*"\s+value=\{currentValues\.buyPrice\}\s+onChange=\{\(e\) => \{\s*const newVals = \{ \.\.\.bulkValues, \[product\.id\]: \{ \.\.\.currentValues, buyPrice: parseFloat\(e\.target\.value\) \} \};\s*setBulkValues\(newVals\);\s*\}\}\s*\/>/g,
    '<EnterpriseInput type="number" value={currentValues.buyPrice} onChange={(e) => { const newVals = { ...bulkValues, [product.id]: { ...currentValues, buyPrice: parseFloat(e.target.value) || 0 } }; setBulkValues(newVals); }} />'
);

content = content.replace(
    /<input\s+type="number"\s+className="w-full bg-blue-50\/50[^"]*"\s+value=\{currentValues\.price\}\s+onChange=\{\(e\) => \{\s*const newVals = \{ \.\.\.bulkValues, \[product\.id\]: \{ \.\.\.currentValues, price: parseFloat\(e\.target\.value\) \} \};\s*setBulkValues\(newVals\);\s*\}\}\s*\/>/g,
    '<EnterpriseInput type="number" value={currentValues.price} onChange={(e) => { const newVals = { ...bulkValues, [product.id]: { ...currentValues, price: parseFloat(e.target.value) || 0 } }; setBulkValues(newVals); }} className="!bg-indigo-50/50 dark:!bg-indigo-500/10" />'
);

// buttons
content = content.replace(
    /<button onClick=\{onClose\} className="w-8 h-8 rounded-full[^"]*">✕<\/button>/g,
    '<button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 flex items-center justify-center dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-400 font-medium">✕</button>'
);

content = content.replace(
    /<button className="text-\[12px\] font-bold tracking-widest text-slate-500[^"]*" onClick=\{onClose\} disabled=\{isProcessing\}>VAZGEÇ<\/button>/g,
    '<EnterpriseButton variant="secondary" onClick={onClose} disabled={isProcessing}>VAZGEÇ</EnterpriseButton>'
);

content = content.replace(
    /<button className="bg-blue-600 hover:bg-blue-700 text-white[^"]*" onClick=\{handleApply\} disabled=\{isProcessing\}>\s*\{isProcessing \? 'SİSTEME İŞLENİYOR\.\.\.' : 'ONAYLA'\}\s*<\/button>/g,
    '<EnterpriseButton onClick={handleApply} disabled={isProcessing}>{isProcessing ? \'SİSTEME İŞLENİYOR...\' : \'ONAYLA\'}</EnterpriseButton>'
);

content = content.replace(
    /<button\s+onClick=\{applyAdjustmentRule\}\s+className="bg-blue-600 text-white[^"]*"\s*>\s*Hepsini Güncelle\s*<\/button>/g,
    '<EnterpriseButton onClick={applyAdjustmentRule}>Hepsini Güncelle</EnterpriseButton>'
);


fs.writeFileSync('src/app/(app)/inventory/components/InventoryBulkEditModal.tsx', content);
