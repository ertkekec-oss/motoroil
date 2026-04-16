const fs = require('fs');

let file = fs.readFileSync('src/components/terminal/AiCashierPanel.tsx', 'utf8');

if (!file.includes('const { t } = useLanguage()')) {
    file = file.replace('const isAiEnabled = process.env.NEXT_PUBLIC_POS_AI_CASHIER !== \'false\';', "import { useLanguage } from '@/contexts/LanguageContext';\n\n$&");
    file = file.replace('const [isCollapsed, setIsCollapsed] = useState(false);', "const [isCollapsed, setIsCollapsed] = useState(false);\n    const { t } = useLanguage();");
}

file = file.replace(/>Akıllı Kasiyer \(AI\)</g, ">{t('ai.cashier')}<");
file = file.replace(/'GÖSTER' : 'GİZLE'/g, "t('ai.show') : t('ai.hide')");
file = file.replace(/>Öneri İçin Ürün Ekleyin</g, ">{t('ai.addForSuggestion')}<");
file = file.replace(/>Birlikte Alınan</g, ">{t('ai.boughtTogether')}<");
file = file.replace(/>\s*EKLE\s*</g, ">\n                                        {t('ai.add')}\n                                    <");
file = file.replace(/>Uygun Öneri Bulunamadı</g, ">{t('ai.noSuggestion')}<");

fs.writeFileSync('src/components/terminal/AiCashierPanel.tsx', file);
console.log('AiCashierPanel.tsx refactored');
