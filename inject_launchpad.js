const fs = require('fs');
const file = 'src/app/(app)/inventory/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

if (!txt.includes('B2BLaunchpadModal')) {
    txt = txt.replace(
        'import ProductWizardModal from "./components/ProductWizardModal";', 
        'import ProductWizardModal from "./components/ProductWizardModal";\nimport { B2BLaunchpadModal } from "./components/B2BLaunchpadModal";'
    );
}

if (!txt.includes('isLaunchpadOpen')) {
    txt = txt.replace(
        'const [isCurrencyShieldActive, setIsCurrencyShieldActive] = useState(false);',
        'const [isCurrencyShieldActive, setIsCurrencyShieldActive] = useState(false);\n  const [isLaunchpadOpen, setIsLaunchpadOpen] = useState(false);'
    );
}

if (!txt.includes('handlePublishB2B')) {
    txt = txt.replace(
        'const exportToExcel',
        'const handlePublishB2B = () => setIsLaunchpadOpen(true);\n\n  const exportToExcel'
    );
}

if (txt.includes('onProductClick={(product) =>')) {
    // Only insert onPublishB2B if it doesn't already exist in the props
    if (!txt.includes('onPublishB2B={handlePublishB2B}')) {
        txt = txt.replace(
            'onProductClick={(product) =>',
            'onPublishB2B={handlePublishB2B}\n              onProductClick={(product) =>'
        );
    }
}

if (!txt.includes('<B2BLaunchpadModal')) {
    txt = txt.replace(
        '</Suspense>',
        '</Suspense>\n\n      <B2BLaunchpadModal isOpen={isLaunchpadOpen} onClose={() => setIsLaunchpadOpen(false)} productIds={selectedIds} products={products || []} onConfirm={async (ids) => { setIsLaunchpadOpen(false); alert("Ateşleme Başarılı! " + ids.length + " ürün Periodya Hub\'da global satışa açıldı."); }} />'
    );
}

// Fix the alert above with showSuccess using string replacement
txt = txt.replace('alert("Ateşleme Başarılı! " + ids.length + " ürün Periodya Hub\\\'da global satışa açıldı.");', 'showSuccess("Ateşleme Başarılı!", ids.length + " ürün Periodya Hub\'da global satışa açıldı."); setSelectedIds([]);');

fs.writeFileSync(file, txt);
console.log('Injected B2BLaunchpadModal into inventory/page.tsx');
