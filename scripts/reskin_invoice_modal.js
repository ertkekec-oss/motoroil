const fs = require('fs');

const file = 'src/components/modals/SupplierInvoiceUploadModal.tsx';
let data = fs.readFileSync(file, 'utf8');

// Replace the main wrappers
data = data.replace(/<div style=\{\{ position: 'fixed', inset: 0, background: 'rgba\(0,0,0,0\.85\)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 \}\}>/, 
    `<div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[1100]">`
);

data = data.replace(/<div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-slide-up" style=\{\{ width: '800px', maxWidth: '95vw', border: '1px solid rgba\(255,255,255,0\.1\)', boxShadow: '0 25px 50px -12px rgba\(0,0,0,0\.5\)', borderRadius: '24px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' \}\}>/, 
    `<div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 shadow-2xl rounded-[24px] w-full max-w-[800px] max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">`
);

// Header
data = data.replace(/<div style=\{\{ padding: '24px', borderBottom: '1px solid rgba\(255,255,255,0\.05\)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' \}\}>/, 
    `<div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">`
);
data = data.replace(/<div style=\{\{ display: 'flex', alignItems: 'center', gap: '16px' \}\}>/, `<div className="flex items-center gap-4">`);
data = data.replace(/<div style=\{\{ width: '48px', height: '48px', background: 'rgba\(59, 130, 246, 0\.1\)', color: '#3b82f6', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' \}\}>📄<\/div>/, 
    `<div className="w-[48px] h-[48px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-[14px] flex items-center justify-center text-[24px]">📄</div>`
);
data = data.replace(/<h2 style=\{\{ fontSize: '22px', fontWeight: '800', margin: 0, color: 'white' \}\}>Akıllı Fatura Yükleme<\/h2>/, 
    `<h2 className="text-[18px] font-black tracking-tight text-slate-800 dark:text-white m-0">Akıllı Fatura Yükleme</h2>`
);
data = data.replace(/<p style=\{\{ fontSize: '12px', color: '#888', margin: 0 \}\}>Pdf formatındaki e-Fatura \/ İrsaliyeleri okuyarak envantere aktarır<\/p>/, 
    `<p className="text-[12px] font-medium text-slate-500 m-0 mt-0.5">Pdf formatındaki e-Fatura / İrsaliyeleri okuyarak envantere aktarır</p>`
);
data = data.replace(/<button style=\{\{ background: 'rgba\(255,255,255,0\.05\)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' \}\} onClick=\{onClose\}>\&times;<\/button>/, 
    `<button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-colors text-[24px]">&times;</button>`
);

// Body
data = data.replace(/<div style=\{\{ padding: '24px', overflowY: 'auto', flex: 1 \}\}>/, `<div className="p-6 overflow-y-auto flex-1 custom-scroll">`);

data = data.replace(/style=\{\{ border: '2px dashed rgba\(255,255,255,0\.2\)', borderRadius: '16px', padding: '60px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0\.2s' \}\}/g, 
    `className="border-2 border-dashed border-slate-300 dark:border-white/20 rounded-[16px] py-[60px] px-5 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-all"`
);
data = data.replace(/<div style=\{\{ fontSize: '48px', marginBottom: '16px' \}\}>📤<\/div>/, `<div className="text-[48px] mb-4">📤</div>`);
data = data.replace(/<h3 style=\{\{ color: 'white', marginBottom: '8px' \}\}>Fatura Seç veya Sürükle Bırak<\/h3>/, `<h3 className="text-[18px] font-black text-slate-800 dark:text-white mb-2">Fatura Seç veya Sürükle Bırak</h3>`);
data = data.replace(/<p style=\{\{ color: '#888', fontSize: '13px' \}\}>\(Yalnızca \.pdf Fatura veya İrsaliye dökümanları\)<\/p>/, `<p className="text-[13px] font-medium text-slate-500">(Yalnızca .pdf Fatura veya İrsaliye dökümanları)</p>`);

data = data.replace(/style=\{\{ padding: '60px 20px', textAlign: 'center' \}\}/g, `className="py-[60px] px-5 text-center"`);
data = data.replace(/<div style=\{\{ fontSize: '48px', marginBottom: '16px', animation: 'spin 2s linear infinite' \}\}>⏳<\/div>/, `<div className="text-[48px] mb-4 animate-spin">⏳</div>`);
data = data.replace(/<h3 style=\{\{ color: 'white', marginBottom: '8px' \}\}>Yapay Zeka Faturayı Okuyor\.\.\.<\/h3>/, `<h3 className="text-[18px] font-black text-slate-800 dark:text-white mb-2">Yapay Zeka Faturayı Okuyor...</h3>`);
data = data.replace(/<p style=\{\{ color: '#888', fontSize: '13px' \}\}>Ürünler, fiyatlar ve miktarlar eşleştiriliyor\.<\/p>/, `<p className="text-[13px] font-medium text-slate-500">Ürünler, fiyatlar ve miktarlar eşleştiriliyor.</p>`);

data = data.replace(/<div style=\{\{ display: 'flex', flexDirection: 'column', gap: '20px' \}\}>/, `<div className="flex flex-col gap-5">`);
data = data.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: 'rgba\(255,255,255,0\.02\)', padding: '16px', borderRadius: '12px' \}\}>/, `<div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[16px] border border-slate-100 dark:border-white/5">`);

// Replace standard labels and inputs
data = data.replace(/<label style=\{\{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' \}\}>/g, `<label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">`);
data = data.replace(/style=\{\{ width: '100%', padding: '10px', background: 'rgba\(0,0,0,0\.3\)', border: '1px solid rgba\(255,255,255,0\.05\)', borderRadius: '8px', color: 'white' \}\}/g, 
    `className="w-full h-[42px] px-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[10px] text-[14px] font-bold text-slate-800 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-colors"`
);

data = data.replace(/<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' \}\}>/, `<div className="flex justify-between items-center mb-3">`);
data = data.replace(/<h4 style=\{\{ color: 'white', margin: 0 \}\}>Tespit Edilen Kalemler<\/h4>/, `<h4 className="text-[15px] font-black text-slate-800 dark:text-white m-0">Tespit Edilen Kalemler</h4>`);
data = data.replace(/<span style=\{\{ fontSize: '12px', color: '#888' \}\}>/g, `<span className="text-[12px] font-bold text-slate-500">`);

data = data.replace(/style=\{\{ padding: '30px', textAlign: 'center', background: 'rgba\(239, 68, 68, 0\.05\)', border: '1px solid rgba\(239, 68, 68, 0\.2\)', borderRadius: '12px', color: '#ef4444' \}\}/g, 
    `className="p-6 text-center bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-[12px] text-red-600 dark:text-red-400 font-semibold text-[13px]"`
);

data = data.replace(/<div style=\{\{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' \}\}>/, `<div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scroll pr-1">`);
data = data.replace(/style=\{\{ padding: '12px', background: 'rgba\(255,255,255,0\.03\)', borderRadius: '8px', border: '1px solid rgba\(255,255,255,0\.05\)', display: 'flex', alignItems: 'center', gap: '12px' \}\}/g, 
    `className="p-3 bg-white dark:bg-slate-800/50 rounded-[12px] border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row shadow-sm items-start sm:items-center gap-3"`
);

// Inner Item inputs
data = data.replace(/style=\{\{ width: '100%', padding: '6px 8px', background: 'transparent', border: 'none', borderBottom: '1px dashed rgba\(255,255,255,0\.2\)', color: 'white', fontSize: '14px', fontWeight: 'bold' \}\}/g, 
    `className="w-full px-2 py-1 bg-transparent border-b border-dashed border-slate-300 dark:border-white/20 text-slate-800 dark:text-white text-[14px] font-black focus:outline-none focus:border-blue-500"`
);
data = data.replace(/<div style=\{\{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' \}\}>/, `<div className="flex flex-wrap items-center gap-3 mt-2">`);
data = data.replace(/style=\{\{ width: '120px', padding: '4px', background: 'rgba\(0,0,0,0\.2\)', border: '1px solid rgba\(255,255,255,0\.1\)', color: '#888', fontSize: '11px', borderRadius: '4px' \}\}/g, 
    `className="w-[120px] px-2 py-1.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-[11px] font-bold rounded-[6px] outline-none"`
);
data = data.replace(/<span style=\{\{ fontSize: '11px', color: '#555' \}\}>Sistem karşılığı yoksa otomatik eklenecektir\.<\/span>/, `<span className="text-[11px] font-semibold text-slate-500">Sistem karşılığı yoksa otomatik eklenecektir.</span>`);

data = data.replace(/<div style=\{\{ display: 'flex', alignItems: 'center', gap: '8px' \}\}>/g, `<div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0">`);
data = data.replace(/style=\{\{ width: '60px', padding: '6px', background: 'rgba\(0,0,0,0\.3\)', border: '1px solid rgba\(255,255,255,0\.1\)', color: 'white', borderRadius: '4px', textAlign: 'center' \}\}/g, 
    `className="w-[60px] h-[32px] px-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-[8px] font-bold text-center outline-none focus:border-blue-500"`
);
data = data.replace(/style=\{\{ width: '80px', padding: '6px', background: 'rgba\(0,0,0,0\.3\)', border: '1px solid rgba\(255,255,255,0\.1\)', color: 'white', borderRadius: '4px', textAlign: 'right' \}\}/g, 
    `className="w-[80px] h-[32px] px-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-[8px] font-bold text-right outline-none focus:border-blue-500"`
);
data = data.replace(/<span style=\{\{ fontSize: '12px', color: '#888' \}\}>/g, `<span className="text-[12px] font-bold text-slate-500">`);
data = data.replace(/<span style=\{\{ fontSize: '12px', color: '#555' \}\}>/g, `<span className="text-[12px] font-bold text-slate-400">`);
data = data.replace(/<span style=\{\{ fontSize: '14px', color: 'white', fontWeight: 'bold', minWidth: '80px', textAlign: 'right' \}\}>/g, `<span className="text-[14px] font-black text-blue-600 dark:text-blue-400 min-w-[80px] text-right">`);
data = data.replace(/style=\{\{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px', padding: '0 8px' \}\}/g, `className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-[20px]"`);

// Footer
data = data.replace(/<div style=\{\{ padding: '24px', borderTop: '1px solid rgba\(255,255,255,0\.05\)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba\(0,0,0,0\.2\)', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' \}\}>/, 
    `<div className="px-6 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-[24px]">`
);
data = data.replace(/<span style=\{\{ fontSize: '12px', color: '#888', display: 'block' \}\}>Genel Toplam \(Tedarikçi Borcu\)<\/span>/, `<span className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-1">Genel Toplam (Tedarikçi Borcu)</span>`);
data = data.replace(/<span style=\{\{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' \}\}>/g, `<span className="text-[24px] font-black text-blue-600 dark:text-blue-400 tracking-tight">`);

data = data.replace(/<div style=\{\{ display: 'flex', gap: '12px' \}\}>/, `<div className="flex items-center gap-3 w-full sm:w-auto">`);
data = data.replace(/style=\{\{ padding: '12px 24px', background: 'transparent', border: '1px solid #555', color: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' \}\}/g, 
    `className="flex-1 sm:flex-none px-5 h-[44px] rounded-[10px] text-[13px] font-bold text-slate-700 bg-white dark:bg-[#0f172a] dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"`
);
data = data.replace(/style=\{\{ padding: '12px 32px', background: '#3b82f6', border: 'none', color: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', opacity: \(isSaving \|\| invoiceData\.items\.length === 0\) \? 0\.5 : 1, boxShadow: '0 4px 15px rgba\(59, 130, 246, 0\.4\)' \}\}/g, 
    `className="flex-1 sm:flex-none px-6 h-[44px] rounded-[10px] text-[13px] font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"`
);

fs.writeFileSync(file, data);
console.log('SupplierInvoiceUploadModal UI Reskinned completely!');
