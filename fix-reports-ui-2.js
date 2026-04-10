const fs = require('fs');

let content = fs.readFileSync('src/app/(app)/reports/page.tsx', 'utf8');

// Replace standard flexbox style inlines
content = content.replace(/style=\{\{ display: 'flex', flexDirection: 'column', gap: '12px' \}\}/g, 'className="flex flex-col gap-3"');
content = content.replace(/style=\{\{ display: 'flex', flexDirection: 'column', gap: '24px' \}\}/g, 'className="flex flex-col gap-6"');
content = content.replace(/style=\{\{ padding: '24px', borderRadius: '16px' \}\}/g, '');
content = content.replace(/style=\{\{ padding: '24px', borderRadius: '16px', background: 'rgba\\(16, 185, 129, 0.05\\)', border: `1px solid \$\{COLORS.success\}55` \}\}/g, '');
content = content.replace(/style=\{\{ padding: '24px', borderRadius: '16px', background: 'rgba\\(239, 68, 68, 0.05\\)', border: `1px solid \$\{COLORS.danger\}55` \}\}/g, '');
content = content.replace(/style=\{\{ fontSize: '12px', color: 'var\(--text-muted\)', marginBottom: '8px' \}\}/g, 'className="text-xs text-slate-500 font-bold mb-2 tracking-wide"');
content = content.replace(/style=\{\{ fontWeight: '700' \}\}/g, 'className="font-bold text-slate-900 dark:text-white"');
content = content.replace(/style=\{\{ fontWeight: '700', color: COLORS.success \}\}/g, 'className="font-bold text-emerald-600 dark:text-emerald-500"');
content = content.replace(/style=\{\{ color: COLORS.danger \}\}/g, 'className="font-bold text-red-600 dark:text-red-500"');
content = content.replace(/style=\{\{ color: COLORS.primary \}\}/g, 'className="font-bold text-blue-600 dark:text-blue-500"');
content = content.replace(/style=\{\{ fontWeight: '700', color: \(financialSummary.receivable - financialSummary.payable\) >= 0 \? COLORS.success : COLORS.danger \}\}/g, 'className={`font-black ${(financialSummary.receivable - financialSummary.payable) >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"}`}');
content = content.replace(/style=\{\{ paddingTop: '12px', borderTop: '1px solid rgba\\(255,255,255,0.1\\)', color: COLORS.success, fontWeight: '900' \}\}/g, 'className="pt-3 border-t border-slate-100 dark:border-white/5 font-black text-emerald-600 dark:text-emerald-500 mt-1"');
content = content.replace(/style=\{\{ paddingTop: '12px', borderTop: '1px solid rgba\\(255,255,255,0.1\\)' \}\}/g, 'className="pt-3 border-t border-slate-100 dark:border-white/5 mt-1"');
content = content.replace(/style=\{\{ paddingTop: '12px', borderTop: '1px solid rgba\\(255,255,255,0.1\\)', fontWeight: '900' \}\}/g, 'className="pt-3 border-t border-slate-100 dark:border-white/5 font-black mt-1 text-slate-900 dark:text-white"');


content = content.replace(/style=\{\{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' \}\}/g, 'className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5"');


// Top Summary Big Text
content = content.replace(/<div style=\{\{ fontSize: '14px', color: 'var\(--text-muted\)', marginBottom: '8px' \}\}>.*?(?=<\/div>)/g, (match) => {
    return `<div className="text-sm font-bold text-slate-500 tracking-wide uppercase mb-2 z-10 relative">` + match.replace(/<[^>]+>/g, '').replace(/style=\{[^}]+\}/g, '').trim().substring(90);
});

content = content.replace(/style=\{\{ fontSize: '36px', fontWeight: '900', color: COLORS.success \}\}/g, 'className="text-4xl font-black text-emerald-600 dark:text-emerald-500 z-10 relative"');
content = content.replace(/style=\{\{ fontSize: '36px', fontWeight: '900', color: COLORS.danger \}\}/g, 'className="text-4xl font-black text-red-600 dark:text-red-500 z-10 relative"');
content = content.replace(/style=\{\{ fontSize: '12px', color: 'var\(--text-muted\)', marginTop: '4px' \}\}/g, 'className="text-xs font-medium text-slate-400 mt-2 z-10 relative"');
content = content.replace(/<div style=\{\{ fontSize: '24px', marginBottom: '12px' \}\}>.*?<\/div>/g, ''); // Remove emojis from hidden cost cards
content = content.replace(/style=\{\{ fontSize: '28px', fontWeight: '900' \}\}/g, 'className="text-2xl font-black text-slate-900 dark:text-white"');
content = content.replace(/<p style=\{\{ fontSize: '11px', color: 'var\(--text-muted\)', marginTop: '8px' \}\}>/g, '<p className="text-xs font-semibold text-slate-400 mt-2">');

content = content.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(auto-fit, minmax\(250px, 1fr\)\)', gap: '20px' \}\}>/g, '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">');

content = content.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' \}\}>/g, '<div className="grid grid-cols-1 md:grid-cols-2 gap-5">');

content = content.replace(/<div style=\{\{ fontSize: '11px', fontWeight: '800', color: 'var\(--text-muted\)', letterSpacing: '1px', marginBottom: '8px' \}\}>/g, '<div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 z-10 relative">');
content = content.replace(/<div style=\{\{ fontSize: '36px', fontWeight: '900', color: 'white' \}\}>/g, '<div className="text-4xl font-black text-slate-900 dark:text-white z-10 relative mb-1">');
content = content.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(auto-fill, minmax\(300px, 1fr\)\)', gap: '16px' \}\}>/g, '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">');

content = content.replace(/<div style=\{\{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' \}\}>/g, '<div className="flex justify-between items-center mb-3">');

content = content.replace(/<span style=\{\{ fontSize: '24px' \}\}>.*?<\/span>/g, '<span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg">📦</span>');

content = content.replace(/<span style=\{\{ fontSize: '11px', fontWeight: '700', color: Number\(product.stock\) < Number\(product.minStock\) \? COLORS.danger : COLORS.success \}\}>/g, '<span className={`text-[10px] uppercase font-black px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border ${Number(product.stock) < Number(product.minStock) ? "text-red-500 border-red-200 dark:border-red-500/20" : "text-emerald-500 border-emerald-200 dark:border-emerald-500/20"}`}>');


content = content.replace(/<div style=\{\{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' \}\}>/g, '<div className="text-sm font-bold text-slate-900 dark:text-white mb-2 truncate">');
content = content.replace(/<div style=\{\{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var\(--text-muted\)', marginBottom: '12px' \}\}>/g, '<div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">');
content = content.replace(/<div style=\{\{ fontSize: '20px', fontWeight: '900', color: COLORS.primary \}\}>/g, '<div className="text-xl font-black text-slate-900 dark:text-white">');


content = content.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(auto-fill, minmax\(350px, 1fr\)\)', gap: '16px' \}\}>/g, '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">');
content = content.replace(/<div style=\{\{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' \}\}>/g, '<div className="flex justify-between items-start mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">');

content = content.replace(/<div style=\{\{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' \}\}>/g, '<div className="text-base font-black text-slate-900 dark:text-white mb-1 leading-tight">');
content = content.replace(/<div style=\{\{ fontSize: '12px', color: 'var\(--text-muted\)' \}\}>/g, '<div className="text-xs font-semibold text-slate-500">');
content = content.replace(/<div style=\{\{ background: 'rgba\(255,255,255,0.03\)', padding: '16px', borderRadius: '12px' \}\}>/g, '<div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 flex flex-col justify-center items-center">');

content = content.replace(/<div style=\{\{ fontSize: '11px', color: 'var\(--text-muted\)', marginBottom: '4px' \}\}>/g, '<div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">');
content = content.replace(/<div style=\{\{ fontSize: '24px', fontWeight: '900', color: Number\(customer.balance\) > 0 \? COLORS.success : Number\(customer.balance\) < 0 \? COLORS.danger : 'white' \}\}>/g, '<div className={`text-2xl font-black ${Number(customer.balance) > 0 ? "text-emerald-600 dark:text-emerald-400" : Number(customer.balance) < 0 ? "text-red-500 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>');
content = content.replace(/<div style=\{\{ fontSize: '11px', color: 'var\(--text-muted\)', marginTop: '4px' \}\}>/g, '<div className="text-xs font-semibold text-slate-500 mt-1">');


content = content.replace(/<div style=\{\{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' \}\}>/g, '<div className="text-base font-bold text-slate-900 dark:text-white mb-2">');
content = content.replace(/<div style=\{\{ fontSize: '28px', fontWeight: '900', color: COLORS.cyan \}\}>/g, '<div className="text-3xl font-black text-slate-900 dark:text-white">');


fs.writeFileSync('src/app/(app)/reports/page.tsx', content);
