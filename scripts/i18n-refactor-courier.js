const fs = require('fs');

let file = fs.readFileSync('src/components/terminal/CourierDispatchWorkspace.tsx', 'utf8');

if (!file.includes('const { t } = useLanguage()')) {
    file = file.replace('const { showConfirm, showSuccess } = useModal();', 'const { showConfirm, showSuccess } = useModal();\n    const { t } = useLanguage();');
    file = file.replace("import { useModal } from '@/contexts/ModalContext';", "import { useModal } from '@/contexts/ModalContext';\nimport { useLanguage } from '@/contexts/LanguageContext';");
}

file = file.replace(/Kurye Operasyonu/g, "{t('courier.title')}");
file = file.replace(/Paket Servis Takibi ve Zimmet Panosu/g, "{t('courier.subtitle')}");
file = file.replace(/'Zimmet \(Kanban\)'/g, "t('courier.tabDispatch')");
file = file.replace(/>Zimmet \(Kanban\)</g, ">{t('courier.tabDispatch')}<");
file = file.replace(/> Canlı Harita</g, "> {t('courier.tabMap')}<");
file = file.replace(/>Teslimat Bekleyen Siparişler</g, ">{t('courier.waitingOrders')}<");
file = file.replace(/ Paket</g, " {t('courier.package')}<");
file = file.replace(/Kurye Seç.../g, "{t('courier.selectCourier')}");
file = file.replace(/>ATA</g, ">{t('courier.assign')}<");
file = file.replace(/>Aktif Kurye Filosu</g, ">{t('courier.activeFleet')}<");
file = file.replace(/> Tümü Haritada</g, "> {t('courier.allOnMap')}<");
file = file.replace(/>Tahmini Süre</g, ">{t('courier.eta')}<");
file = file.replace(/>Canlı Harita Devrede</g, ">{t('courier.mapActive')}<");
file = file.replace(/Paket servisteki tüm kuryelerinizin anlık koordinatları, Periodya Field Planner altyapısı \(Leaflet OSM\) üzerinden 10 saniyede bir güncellenerek bu alanda yansıtılacaktır\./g, "{t('courier.mapDesc')}");
file = file.replace(/>Zimmet Panosuna Dön</g, ">{t('courier.backToDispatch')}<");

file = file.replace(/'Kurye Atama Onayı'/g, "t('courier.confirmTitle')");
file = file.replace(/`\$\{orderId\} nolu sipariş \$\{courierName\} adlı kuryeye zimmetlenecektir\. Onaylıyor musunuz\?`/g, "`\\$\\{orderId\\} ${t('courier.confirmMsgPart1')} \\$\\{courierName\\} ${t('courier.confirmMsgPart2')}`");
file = file.replace(/'Atandı!'/g, "t('courier.successTitle')");
file = file.replace(/`Sipariş \$\{courierName\} üzerine alındı ve SMS gönderildi\.`/g, "`${t('courier.successMsgPart1')} \\$\\{courierName\\} ${t('courier.successMsgPart2')}`");

fs.writeFileSync('src/components/terminal/CourierDispatchWorkspace.tsx', file);
console.log('CourierDispatchWorkspace.tsx refactored');
