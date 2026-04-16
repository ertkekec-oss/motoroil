const fs = require('fs');

let file = fs.readFileSync('src/contexts/LanguageContext.tsx', 'utf8');

// We use string match since the file format is known and stable
const INJECT_TR = `
            errCustomer: "Cari Seçimi Eksik",
            errCustomerDesc: "Fatura kesebilmek için lütfen Cari Hesap seçiniz.",
            errEmpty: "Fatura Boş",
            errEmptyDesc: "Lütfen en az bir ürün/hizmet ekleyiniz.",
            successGib: "E-Fatura Başarıyla GİB'e İletildi",
            invNoLabel: "Fatura Numarası:",
            placeholderIstisna: "Örn: 301",`;

const INJECT_EN = `
            errCustomer: "Customer Selection Missing",
            errCustomerDesc: "Please select a Customer Account to create an invoice.",
            errEmpty: "Invoice Empty",
            errEmptyDesc: "Please add at least one product/service.",
            successGib: "E-Invoice Successfully Sent to GIB",
            invNoLabel: "Invoice Number:",
            placeholderIstisna: "e.g. 301",`;

const INJECT_DE = `
            errCustomer: "Kundenauswahl Fehlt",
            errCustomerDesc: "Bitte wählen Sie ein Kundenkonto, um eine Rechnung zu erstellen.",
            errEmpty: "Rechnung Leer",
            errEmptyDesc: "Bitte fügen Sie mindestens ein Produkt/eine Dienstleistung hinzu.",
            successGib: "E-Rechnung erfolgreich an GIB gesendet",
            invNoLabel: "Rechnungsnummer:",
            placeholderIstisna: "z.B. 301",`;

const COURIER_TR = `
        courier: {
            title: "Kurye Operasyonu",
            subtitle: "Paket Servis Takibi ve Zimmet Panosu",
            tabDispatch: "Zimmet (Kanban)",
            tabMap: "Canlı Harita",
            waitingOrders: "Teslimat Bekleyen Siparişler",
            package: "Paket",
            selectCourier: "Kurye Seç...",
            assign: "ATA",
            activeFleet: "Aktif Kurye Filosu",
            allOnMap: "Tümü Haritada",
            eta: "Tahmini Süre",
            mapActive: "Canlı Harita Devrede",
            mapDesc: "Paket servisteki tüm kuryelerinizin anlık koordinatları, Periodya Field Planner altyapısı (Leaflet OSM) üzerinden 10 saniyede bir güncellenerek bu alanda yansıtılacaktır.",
            backToDispatch: "Zimmet Panosuna Dön",
            confirmTitle: "Kurye Atama Onayı",
            confirmMsgPart1: "nolu sipariş",
            confirmMsgPart2: "adlı kuryeye zimmetlenecektir. Onaylıyor musunuz?",
            successTitle: "Atandı!",
            successMsgPart1: "Sipariş",
            successMsgPart2: "üzerine alındı ve SMS gönderildi."
        },`;
const KITCHEN_TR = `
        kitchen: {
            systemTitle: "KITCHEN SYSTEM",
            systemSubtitle: "Mutfak Görüntüleme & Optimizasyon Panosu",
            waiting: "BEKLEYEN",
            waitingNew: "Bekliyor (Yeni)",
            ago: "Önce",
            start: "TEZGAHA AL (BAŞLA)",
            preparing: "Hazırlanıyor",
            readyServe: "BİTTİ (SERVİSE HAZIR)",
            noOrderPrep: "Tezgahta SİPARİŞ YOK",
            readyWaiting: "Hazır (Alınmayı Bekliyor)",
            notified: "GARSONA BİLDİRİLDİ ✔",
            allDelivered: "HAZIRLANAN SİPARİŞLER\\nGARSON TARAFINDAN TESLİM ALINDI",
            successTitle: "Servise Hazır",
            successMsgPart1: "Sipariş #",
            successMsgPart2: "hazırlandı. Garson terminaline bildirim gönderildi."
        },`;
const AI_TR = `
        ai: {
            cashier: "Akıllı Kasiyer (AI)",
            show: "GÖSTER",
            hide: "GİZLE",
            addForSuggestion: "Öneri İçin Ürün Ekleyin",
            boughtTogether: "Birlikte Alınan",
            add: "EKLE",
            noSuggestion: "Uygun Öneri Bulunamadı"
        },`;

const COURIER_EN = `
        courier: {
            title: "Courier Operations",
            subtitle: "Delivery Tracking and Dispatch Board",
            tabDispatch: "Dispatch (Kanban)",
            tabMap: "Live Map",
            waitingOrders: "Waiting Deliveries",
            package: "Package",
            selectCourier: "Select Courier...",
            assign: "ASSIGN",
            activeFleet: "Active Courier Fleet",
            allOnMap: "All on Map",
            eta: "ETA",
            mapActive: "Live Map is Active",
            mapDesc: "The live coordinates of all your couriers are updated every 10 seconds via the Periodya Field Planner infrastructure.",
            backToDispatch: "Back to Dispatch",
            confirmTitle: "Assign Courier Confirmation",
            confirmMsgPart1: "order will be assigned to",
            confirmMsgPart2: ". Do you confirm?",
            successTitle: "Assigned!",
            successMsgPart1: "Order assigned to",
            successMsgPart2: "and SMS sent."
        },`;
const KITCHEN_EN = `
        kitchen: {
            systemTitle: "KITCHEN SYSTEM",
            systemSubtitle: "Kitchen Display & Optimization Board",
            waiting: "PENDING",
            waitingNew: "Waiting (New)",
            ago: "Ago",
            start: "START NOW",
            preparing: "Preparing",
            readyServe: "DONE (READY)",
            noOrderPrep: "NO ORDERS PREPARING",
            readyWaiting: "Ready (Waiting Pickup)",
            notified: "WAITER NOTIFIED ✔",
            allDelivered: "PREPARED ORDERS\\nHAVE BEEN PICKED UP",
            successTitle: "Ready to Serve",
            successMsgPart1: "Order #",
            successMsgPart2: "is ready. Waiter has been notified."
        },`;
const AI_EN = `
        ai: {
            cashier: "Smart Cashier (AI)",
            show: "SHOW",
            hide: "HIDE",
            addForSuggestion: "Add Products for Suggestions",
            boughtTogether: "Bought Together",
            add: "ADD",
            noSuggestion: "No suitable suggestions found"
        },`;

const COURIER_DE = `
        courier: {
            title: "Kurierbetrieb",
            subtitle: "Lieferverfolgung & Disposition",
            tabDispatch: "Disposition (Kanban)",
            tabMap: "Live-Karte",
            waitingOrders: "Ausstehende Lieferungen",
            package: "Paket",
            selectCourier: "Kurier Auswählen...",
            assign: "ZUWEISEN",
            activeFleet: "Aktive Kurierflotte",
            allOnMap: "Alle auf Karte",
            eta: "Vorauss. Zeit",
            mapActive: "Live-Karte ist aktiv",
            mapDesc: "Die Live-Koordinaten all Ihrer Kuriere werden alle 10 Sekunden über die Periodya Field Planner Infrastruktur aktualisiert.",
            backToDispatch: "Zurück zur Disposition",
            confirmTitle: "Kurierzuweisung Bestätigen",
            confirmMsgPart1: "Bestellung",
            confirmMsgPart2: "wird zugewiesen. Bestätigen Sie?",
            successTitle: "Zugewiesen!",
            successMsgPart1: "Bestellung an",
            successMsgPart2: "zugewiesen und SMS gesendet."
        },`;
const KITCHEN_DE = `
        kitchen: {
            systemTitle: "KÜCHENSYSTEM",
            systemSubtitle: "Küchenanzeige & Optimierung",
            waiting: "WARTEND",
            waitingNew: "Wartend (Neu)",
            ago: "Zuvor",
            start: "JETZT STARTEN",
            preparing: "In Zubereitung",
            readyServe: "FERTIG (SERVIERBEREIT)",
            noOrderPrep: "KEINE BESTELLUNGEN IN ZUBEREITUNG",
            readyWaiting: "Fertig (Wartet auf Abholung)",
            notified: "KELLNER INFORMIERT ✔",
            allDelivered: "ZUBEREITETE BESTELLUNGEN\\nWURDEN ABGEHOLT",
            successTitle: "Servierbereit",
            successMsgPart1: "Bestellung #",
            successMsgPart2: "ist bereit. Kellner wurde informiert."
        },`;
const AI_DE = `
        ai: {
            cashier: "Smart Cashier (AI)",
            show: "ANZEIGEN",
            hide: "VERBERGEN",
            addForSuggestion: "Produkte für Vorschläge hinzufügen",
            boughtTogether: "Wird oft zusammen gekauft",
            add: "HINZUFÜGEN",
            noSuggestion: "Keine passenden Vorschläge gefunden"
        },`;

// 1) Replace invoice successTitle with new keys + successTitle TR
file = file.replace('        invoice: {\n            successTitle: "E-Fatura Kesildi",', '        invoice: {\n' + INJECT_TR + '\n            successTitle: "E-Fatura Kesildi",');
// EN
file = file.replace('        invoice: {\n            successTitle: "E-Invoice Issued",', '        invoice: {\n' + INJECT_EN + '\n            successTitle: "E-Invoice Issued",');
// DE
file = file.replace('        invoice: {\n            successTitle: "E-Rechnung erstellt",', '        invoice: {\n' + INJECT_DE + '\n            successTitle: "E-Rechnung erstellt",');

// 2) Replace `menu: {` with Courier + Kitchen + AI + Menu TR
// We find indices of `menu: {\n            workspace: "WORKSPACE",` and replace
let searchStr = '        menu: {\n            workspace: "WORKSPACE",';
file = file.replace(searchStr, COURIER_TR + '\n' + KITCHEN_TR + '\n' + AI_TR + '\n' + searchStr);
// Then EN
file = file.replace(searchStr, COURIER_EN + '\n' + KITCHEN_EN + '\n' + AI_EN + '\n' + searchStr);

// DE uses "ARBEITSBEREICH"
let searchStrDe = '        menu: {\n            workspace: "ARBEITSBEREICH",';
file = file.replace(searchStrDe, COURIER_DE + '\n' + KITCHEN_DE + '\n' + AI_DE + '\n' + searchStrDe);

fs.writeFileSync('src/contexts/LanguageContext.tsx', file);
console.log('LanguageContext fully built and updated!');
