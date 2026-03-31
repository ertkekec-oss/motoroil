const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

// The expanded area uses inline styles that force dark mode
data = data.replace(
    /style=\{\{ background: 'var\(--bg-panel, rgba\(15, 23, 42, 0\.4\)\)', borderRadius: '20px', padding: '24px', border: '1px solid rgba\(255,255,255,0\.05\)' \}\}/g,
    `className="bg-white dark:bg-slate-800/50 rounded-[20px] p-6 border border-slate-200 dark:border-white/5 shadow-sm"`
);

// FİNANSAL ÖZET GENEL TOPLAM color text-main
data = data.replace(/color: 'var\(--text-main, #fff\)'/g, `className="text-slate-900 dark:text-white"`);

// Items rows
data = data.replace(
    /style=\{\{ display: 'flex', gap: '16px', padding: '16px', background: 'var\(--bg-panel, rgba\(0,0,0,0\.2\)\)', borderRadius: '16px', border: '1px solid rgba\(255,255,255,0\.05\)' \}\}/g,
    `className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-[16px] border border-slate-200 dark:border-white/5"`
);

data = data.replace(
    /style=\{\{ background: 'var\(--bg-card, rgba\(255,255,255,0\.05\)\)', border: '1px solid var\(--border-color, rgba\(255,255,255,0\.1\)\)', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: 'var\(--text-muted, #888\)' \}\}/g,
    `className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[12px] w-10 h-10 flex items-center justify-center text-[13px] font-bold text-slate-500"`
);

data = data.replace(
    /style=\{\{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var\(--text-main, #fff\)', letterSpacing: '0\.5px' \}\}/g,
    `className="m-0 text-[14px] font-extrabold text-slate-900 dark:text-white tracking-wide"`
);

data = data.replace(
    /style=\{\{ fontWeight: '800', color: 'var\(--text-main, #fff\)', fontFamily: 'monospace', fontSize: '15px' \}\}/g,
    `className="font-extrabold text-slate-900 dark:text-white font-mono text-[15px]"`
);

// Title SATIŞ ÖZETİ - it might have been missed
data = data.replace(
    /style=\{\{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var\(--text-main, #fff\)', letterSpacing: '0\.5px' \}\}/g,
    `className="m-0 text-[14px] font-extrabold text-slate-900 dark:text-white tracking-[0.5px]"`
);

// Some text-muted things
data = data.replace(/color: 'var\(--text-muted, #888\)'/g, `className="text-slate-500"`);
data = data.replace(/color: 'var\(--text-muted, #aaa\)'/g, `className="text-slate-400"`);
data = data.replace(/color: 'var\(--text-muted, #666\)'/g, `className="text-slate-500"`);
data = data.replace(/background: 'var\(--bg-card, rgba\(255,255,255,0\.05\)\)'/g, `className="bg-slate-50 dark:bg-slate-800"`);

fs.writeFileSync(file, data);
console.log('Fixed expanded row dark styles');
