const fs = require('fs');
let file = 'c:\\Users\\ertke\\OneDrive\\Masaüstü\\periodya\\muhasebeapp\\motoroil\\src\\app\\(app)\\staff\\me\\page.tsx';
let txt = fs.readFileSync(file, 'utf8');

// 1. SCROLL VE YÜKSEKLİK ZORLAMALARINI TOPTAN SİL 
// "Tüm sekmelerde aşağı kaydırma sorunu var" hatasını düzelten mutlak çözüm. İç kaydırma çubuklarını yok eder, sayfa tümüyle doğal akar.
txt = txt.replace(/min-h-\[600px\]/g, '');
txt = txt.replace(/h-\[calc\(100vh-[0-9]+px\)\]/g, '');
txt = txt.replace(/h-\[calc\(100vh-280px\)\]/g, '');
txt = txt.replace(/overflow-y-auto/g, '');
txt = txt.replace(/custom-scrollbar/g, '');
txt = txt.replace(/overflow-hidden/g, '');

// 2. KESİLMİŞ/YUTULMUŞ PDKS & VARDİYA BAŞLIKLARINA PADDING EKLE VE SCROLLU TEMİZLE
// (İkonlar pencerenin altında kalıyor hatası için)
txt = txt.replace(/<div className="bg-white dark:bg-\[\#1e293b\]\/50 rounded-\[32px\] border-none ring-0 shadow-none flex flex-col">/g, '<div className="bg-white dark:bg-[#1e293b]/50 rounded-[32px] border-none ring-0 shadow-none flex flex-col p-6 lg:p-8">');
txt = txt.replace(/<div className="bg-white dark:bg-\[\#1e293b\]\/50 rounded-\[32px\] border-none ring-0 shadow-none flex flex-col p-4">/g, '<div className="bg-white dark:bg-[#1e293b]/50 rounded-[32px] border-none ring-0 shadow-none flex flex-col p-6 lg:p-8">');

// 3. VARDİYA KUTULARINI KÜÇÜLTECEK "FLEX" SİSTEMİ
// "Vardiya kutuları neden bu kadar büyük?"
txt = txt.replace(/<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">/g, '<div className="flex flex-wrap gap-4">');
txt = txt.replace(/<div key=\{idx\} className="bg-slate-50/g, '<div key={idx} className="w-full md:w-[320px] shrink-0 bg-slate-50');

// 4. İZİNLER SEKMESİ (LEAVES VIEW) - ÇİZGİLERİ VE ESKİ MİMARİYİ YOK ET
let leavesStart = txt.indexOf('// ─── LEAVES VIEW');
let payrollStart = txt.indexOf('// ─── PAYROLL VIEW');
if (leavesStart !== -1 && payrollStart !== -1) {
    let leavesTxt = txt.substring(leavesStart, payrollStart);
    // Eski kartları SoftContainer'a çevir, çizgi bırakan Enterprise bileşenlerinden arındır
    leavesTxt = leavesTxt.replace(/<EnterpriseCard className="h-full flex flex-col min-h-\[400px\]">/gi, '<SoftContainer title="Yeni Talep Oluştur" icon={<Calendar className="w-5 h-5"/>} className="w-full border-none ring-0">');
    leavesTxt = leavesTxt.replace(/<EnterpriseCard className="h-full flex flex-col col-span-1 lg:col-span-2 min-h-\[400px\]">/gi, '<SoftContainer title="İzin Sicilim" icon={<Calendar className="w-5 h-5"/>} className="w-full border-none ring-0">');
    leavesTxt = leavesTxt.replace(/<\/EnterpriseCard>/g, '</SoftContainer>');
    leavesTxt = leavesTxt.replace(/<EnterpriseSectionHeader title="Yeni Talep Oluştur" icon="📝" \/>/g, '');
    leavesTxt = leavesTxt.replace(/<EnterpriseSectionHeader title="İzin Sicilim" icon="🕘" \/>/g, '');
    
    // Tablolardaki kalın çizgileri şeffaf/temiz yap
    leavesTxt = leavesTxt.replace(/border-b border-default/g, 'border-b border-slate-100 dark:border-white/5');
    leavesTxt = leavesTxt.replace(/border-divider/g, 'border-slate-100 dark:border-white/5');
    // Yukarıdaki yutma ve çizgileri engelleyen div'ler
    leavesTxt = leavesTxt.replace(/border-y border-default/g, 'border-y border-slate-100');
    
    txt = txt.substring(0, leavesStart) + leavesTxt + txt.substring(payrollStart);
}

// 5. RAPORLAR SEKMESİ (REPORTS VIEW)
let reportsStart = txt.indexOf('// ─── REPORTS VIEW');
let mainPageStart = txt.indexOf('// ─── MAIN PAGE');
if (reportsStart !== -1 && mainPageStart !== -1) {
    let reportsTxt = txt.substring(reportsStart, mainPageStart);
    reportsTxt = reportsTxt.replace(/border-b border-default/g, 'border-none');
    reportsTxt = reportsTxt.replace(/border-divider/g, 'border-none');
    reportsTxt = reportsTxt.replace(/border-dashed border-default/g, 'border-none');
    reportsTxt = reportsTxt.replace(/border border-state-alert-border/g, 'border-none');
    txt = txt.substring(0, reportsStart) + reportsTxt + txt.substring(mainPageStart);
}

// 6. AKTİF SEKMELERİN (TABS) ZARİF BEYAZ FORMA ÇEYRİLMESİ (Referanstaki bg-white oval gölge)
const tabRegex = /className=\{activeTab === tab\.id[\s\S]*?\}/;
txt = txt.replace(tabRegex, `className={activeTab === tab.id
                                ? "px-5 py-2.5 text-[12px] font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-700 shadow-sm rounded-full transition-all border-none ring-0"
                                : "px-5 py-2.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all rounded-full border-none ring-0 shadow-none"
                            }`);

// Container alt zeminini Referansdaki oval bg-slate-100/50 gri tab kutusuna sokalım:
let tabsOld = '<div className="flex space-x-2 py-4 px-4 custom-scrollbar border-none shrink-0 bg-surface dark:bg-[#0f172a]">';
if(!txt.includes(tabsOld)) {
    // Eger bu string baska formdaysa direkt div>map dongusunu replace edelim.
    txt = txt.replace(/<div className="flex space-x-[^>]+>/, '<div className="flex gap-2 p-1.5 bg-slate-100/60 dark:bg-slate-800/40 rounded-full w-max mx-0 mb-8 border-none ring-0">');
} else {
    txt = txt.replace(tabsOld, '<div className="flex gap-2 p-1.5 bg-slate-100/60 dark:bg-slate-800/40 rounded-full w-max mx-0 mb-8 border-none ring-0">');
}

fs.writeFileSync(file, txt);
console.log('Tasarım İK referansındaki o ferah, çizgisiz, kapsüllü yapıya devşirildi ve kaydırma barları temizlendi.');
