const fs = require('fs');

let file = fs.readFileSync('src/components/terminal/KitchenDisplayWorkspace.tsx', 'utf8');

if (!file.includes('const { t } = useLanguage()')) {
    file = file.replace('const { showSuccess } = useModal();', 'const { showSuccess } = useModal();\n    const { t } = useLanguage();');
    file = file.replace("import { useModal } from '@/contexts/ModalContext';", "import { useModal } from '@/contexts/ModalContext';\nimport { useLanguage } from '@/contexts/LanguageContext';");
}

file = file.replace(/'Servise Hazır'/g, "t('kitchen.successTitle')");
file = file.replace(/`Sipariş #\$\{ticketId\} hazırlandı\. Garson terminaline bildirim gönderildi\.`/g, "`\\$\\{ticketId\\} ${t('kitchen.successMsgPart2')}`");
file = file.replace(/Sipariş #\$\{ticketId\} hazırlandı\./g, "${t('kitchen.successMsgPart1')}\\$\\{ticketId\\} ${t('kitchen.successMsgPart2')}");

// We can just manually replace some specific strings:
file = file.replace(/`Sipariş #\$\{ticketId\} hazırlandı\. Garson terminaline bildirim gönderildi\.`/g, "`${t('kitchen.successMsgPart1')}\\$\\{ticketId\\} ${t('kitchen.successMsgPart2')}`");

file = file.replace(/>KITCHEN SYSTEM <span/g, ">{t('kitchen.systemTitle')} <span");
file = file.replace(/>Mutfak Görüntüleme & Optimizasyon Panosu</g, ">{t('kitchen.systemSubtitle')}<");
file = file.replace(/>\{pendingTickets\.length\} BEKLEYEN</g, ">{pendingTickets.length} {t('kitchen.waiting')}<");
file = file.replace(/>Bekliyor \(Yeni\)</g, ">{t('kitchen.waitingNew')}<");
file = file.replace(/>Önce</g, ">{t('kitchen.ago')}<");
file = file.replace(/> TEZGAHA AL \(BAŞLA\)</g, "> {t('kitchen.start')}<");
file = file.replace(/>Hazırlanıyor</g, ">{t('kitchen.preparing')}<");
file = file.replace(/> BİTTİ \(SERVİSE HAZIR\)</g, "> {t('kitchen.readyServe')}<");
file = file.replace(/Tezgahta SİPARİŞ YOK/g, "{t('kitchen.noOrderPrep')}");
file = file.replace(/>Hazır \(Alınmayı Bekliyor\)</g, ">{t('kitchen.readyWaiting')}<");
file = file.replace(/>GARSONA BİLDİRİLDİ ✔</g, ">{t('kitchen.notified')}<");
file = file.replace(/HAZIRLANAN SİPARİŞLER<br\/>GARSON TARAFINDAN TESLİM ALINDI/g, "{t('kitchen.allDelivered').split('\\\\n').map((line, i) => <React.Fragment key={i}>{line}{i === 0 && <br/>}</React.Fragment>)}"); // Will fix <br/>

fs.writeFileSync('src/components/terminal/KitchenDisplayWorkspace.tsx', file);
console.log('KitchenDisplayWorkspace.tsx refactored');
