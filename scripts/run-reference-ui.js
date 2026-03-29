const fs = require('fs');
const file = 'src/app/(app)/staff/me/page.tsx';
let txt = fs.readFileSync(file, 'utf-8');

// 1. O kaba, altı kalın kara çizgili "ProfileHeader" ı tamamen yok edelim. (Referans ekranda yoktu)
txt = txt.replace(
    /const ProfileHeader = \(\{.*\}\) => \{[\s\S]*?return \([\s\S]*?\n\s+\);\n\};/g,
    `const ProfileHeader = () => null; // Referans İK tasarımına uyum için kaba üst başlık (band) kaldırıldı.`
);

// 2. DashboardView vb. view'lerin içindeki 4'lü metrik bloklarını referanstaki "Pill / Hap" formatına çevirelim.
// Dashboard cards
txt = txt.replace(/bg-white dark:bg-\[\#1e293b\] p-5 flex flex-col justify-between rounded-2xl shadow-\[0_2px_10px_-4px_rgba\(0,0,0,0\.1\)\] border border-transparent/g, 'bg-white dark:bg-[#1e293b] px-5 py-3 rounded-[100px] shadow-sm ring-1 ring-slate-100 flex items-center gap-4');
// Özel renkli kart (Kazanılan prim / Dashboard)
txt = txt.replace(/bg-emerald-50 dark:bg-emerald-900\/10 p-5 flex flex-col justify-between rounded-2xl shadow-\[0_2px_10px_-4px_rgba\(0,0,0,0\.1\)\] border border-transparent/g, 'bg-white dark:bg-[#1e293b] px-5 py-3 rounded-[100px] shadow-sm ring-1 ring-emerald-100 flex items-center gap-4');
// Targets view kartları
txt = txt.replace(/bg-white dark:bg-\[\#1e293b\] rounded-2xl shadow-\[0_2px_10px_-4px_rgba\(0,0,0,0\.1\)\] p-5 flex flex-col justify-between border border-transparent/g, 'bg-white dark:bg-[#1e293b] px-5 py-3 rounded-[100px] shadow-sm ring-1 ring-slate-100 flex items-center gap-4');
txt = txt.replace(/bg-emerald-50 dark:bg-emerald-900\/10 rounded-2xl shadow-\[0_2px_10px_-4px_rgba\(0,0,0,0\.1\)\] p-5 flex flex-col justify-between border border-transparent/g, 'bg-white dark:bg-[#1e293b] px-5 py-3 rounded-[100px] shadow-sm ring-1 ring-emerald-100 flex items-center gap-4');

// Raporlar view kartları (border-t-2 yerine pill stili)
txt = txt.replace(/p-6 rounded-2xl bg-white dark:bg-\[\#1e293b\] shadow-\[0_2px_10px_-4px_rgba\(0,0,0,0\.1\)\] border border-transparent border-t-2 border-t-blue-500/g, 'bg-white dark:bg-[#1e293b] px-5 py-3 rounded-[100px] shadow-sm ring-1 ring-blue-100 flex items-center gap-4');
txt = txt.replace(/p-6 rounded-2xl bg-white dark:bg-\[\#1e293b\] shadow-\[0_2px_10px_-4px_rgba\(0,0,0,0\.1\)\] border border-transparent border-t-2 border-t-emerald-500/g, 'bg-white dark:bg-[#1e293b] px-5 py-3 rounded-[100px] shadow-sm ring-1 ring-emerald-100 flex items-center gap-4');
txt = txt.replace(/p-6 rounded-2xl bg-white dark:bg-\[\#1e293b\] shadow-\[0_2px_10px_-4px_rgba\(0,0,0,0\.1\)\] border border-transparent border-t-2 border-t-slate-500/g, 'bg-white dark:bg-[#1e293b] px-5 py-3 rounded-[100px] shadow-sm ring-1 ring-slate-100 flex items-center gap-4');

// Metrik kartlarındaki h4 (başlık) ve p/div (değer) yapılarını yan yana dizilime uyacak şekilde esnetelim.
// Bu genel metin yerleşimlerini yatay düzene oturtmak için flexbox kullanıyorduk (yukarıdaki regex `flex items-center gap-4` içeriyor)
// Şimdi içindeki justify-between ve mb-2 leri silelim.
txt = txt.replace(/<div className="flex justify-between items-start mb-2">/g, '<div className="flex-1">');
txt = txt.replace(/<h4 className="text-\[10px\] font-bold text-text-secondary uppercase tracking-widest"/g, '<div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest"');
txt = txt.replace(/<\/h4>/g, '</div>');

// Ana container'ı ve gereksiz dev "PERSONEL PORTALI" Header bandını kaldıralım (Layout'a kalsın)
// Referansa (4. resim) zemin `bg-[#f8fafc]` (çok açık gri beyaz)
txt = txt.replace(/<div style=\{\{ background: 'var\(--bg-main\)' \}\} className="min-h-screen text-slate-900 dark:text-white pb-24 no-print relative">[\s\S]*?<div className="max-w-\[1700px\] mx-auto p-8 space-y-8 duration-700">/g, 
`<div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-white pb-24 no-print relative">
    <div className="max-w-[1700px] mx-auto p-6 md:p-8 space-y-8 duration-700">`);

// Sekmeleri (Tabs) o karmaşık yapısından kurtarıp doğrudan tek sıra zarif hap (pill) butonlarına dizelim.
txt = txt.replace(/<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-2">[\s\S]*?\{activeTab === 'dashboard' &&/g,
`<div className="flex flex-wrap items-center justify-center gap-2 mb-8 bg-transparent">
    {[
        { id: 'dashboard', label: 'Özet / PDKS' }, { id: 'tasks', label: 'Görevler' }, { id: 'targets', label: 'Hedefler' }, { id: 'reports', label: 'Raporlar' },
        { id: 'shifts', label: 'Vardiya' }, { id: 'leave', label: 'İzinler' }, { id: 'payroll', label: 'Bordro' }, { id: 'profile', label: 'Profil' }
    ].map(tab => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={activeTab === tab.id
                ? "px-5 py-2.5 text-[12px] font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-white/10 rounded-[16px] transition-all"
                : "px-5 py-2.5 text-[12px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-[16px] border border-transparent"
            }
        >
            {tab.label}
        </button>
    ))}
</div>
{activeTab === 'dashboard' &&`);

// En içte hala duran bir iki border'ı (Örneğin PDKS kutusu, Tablo kapları vb.) ring-1 yapılarına çekelim:
txt = txt.replace(/bg-white dark:bg-\[\#1e293b\] overflow-hidden flex flex-col rounded-2xl shadow-\[0_2px_10px_-4px_rgba\(0,0,0,0\.1\)\] border border-transparent/g, 'bg-white dark:bg-[#1e293b] rounded-[24px] ring-1 ring-slate-100 dark:ring-white/5 shadow-sm overflow-hidden flex flex-col');

fs.writeFileSync(file, txt);
console.log('Referans tasarıma tam uyum (Oval Hap yapısı ve temiz Sidebar) başarıyla uygulandı.');
