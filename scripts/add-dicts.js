const fs = require('fs');

let file = fs.readFileSync('src/contexts/LanguageContext.tsx', 'utf8');

const TR_ADDS = `
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
        },
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
        },
        ai: {
            cashier: "Akıllı Kasiyer (AI)",
            show: "GÖSTER",
            hide: "GİZLE",
            addForSuggestion: "Öneri İçin Ürün Ekleyin",
            boughtTogether: "Birlikte Alınan",
            add: "EKLE",
            noSuggestion: "Uygun Öneri Bulunamadı"
        },
`;

const EN_ADDS = `
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
        },
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
        },
        ai: {
            cashier: "Smart Cashier (AI)",
            show: "SHOW",
            hide: "HIDE",
            addForSuggestion: "Add Products for Suggestions",
            boughtTogether: "Bought Together",
            add: "ADD",
            noSuggestion: "No suitable suggestions found"
        },
`;

const DE_ADDS = `
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
        },
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
        },
        ai: {
            cashier: "Smart Cashier (AI)",
            show: "ANZEIGEN",
            hide: "VERBERGEN",
            addForSuggestion: "Produkte für Vorschläge hinzufügen",
            boughtTogether: "Wird oft zusammen gekauft",
            add: "HINZUFÜGEN",
            noSuggestion: "Keine passenden Vorschläge gefunden"
        },
`;

let content = file;

// Helper to inject before exactly the matched string block.
function injectBefore(substr, replacement) {
    if(!content.includes(substr)) throw new Error("Substring not found!");
    content = content.replace(substr, replacement + substr);
}

// Find TR menu
const trMenuStr = '        menu: {\n            workspace: "WORKSPACE",';
injectBefore(trMenuStr, TR_ADDS);

const enMenuStr = '        menu: {\n            workspace: "WORKSPACE",';
// However, EN has same string. We need to be careful!
// Let's use regex with the preceding context
// Let's just do it directly string hacking.
const blocks = content.split('        menu: {\n            workspace: "WORKSPACE",');
if (blocks.length !== 4) {
    console.error("Mismatch blocks");
} else {
    // blocks[0] is TR so TR_ADDS comes before blocks[1]
    const assembled = blocks[0] + TR_ADDS + '        menu: {\n            workspace: "WORKSPACE",' + blocks[1] + EN_ADDS + '        menu: {\n            workspace: "WORKSPACE",' + blocks[2];
    
    const DEStr = '        menu: {\n            workspace: "ARBEITSBEREICH",';
    const splitDE = assembled.split(DEStr);
    
    file = splitDE[0] + DE_ADDS + DEStr + splitDE[1];
    fs.writeFileSync('src/contexts/LanguageContext.tsx', file);
    console.log("LanguageContext updated with courier, kitchen, ai.");
}

