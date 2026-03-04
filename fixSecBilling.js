const fs = require('fs');

const suspiciousFile = 'src/app/(app)/security/suspicious/page.tsx';
const billingFile = 'src/app/(app)/billing/page.tsx';

// 1. Fix Suspicious Page
if (fs.existsSync(suspiciousFile)) {
    let content = fs.readFileSync(suspiciousFile, 'utf8');

    // Replace root background
    content = content.replace(
        /className="p-6 pb-32 animate-fade-in min-h-screen bg-\[\#080911\]"/g,
        'className="p-6 pb-32 animate-fade-in min-h-screen bg-slate-50 dark:bg-[#020617] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900/40 dark:via-[#020617] dark:to-[#020617]"'
    );

    // Replace cards
    content = content.replace(/dark:bg-slate-900/g, 'dark:bg-[#0f172a]');
    content = content.replace(/dark:border-slate-800/g, 'dark:border-white/5');

    // Make sure text colors are adaptable. it seems suspicious was hardcoded dark
    // For text-white let's replace with text-slate-800 dark:text-white
    // Wait, let's keep text-white for suspicious if they are explicitly dark mode themed, but billing is not.

    fs.writeFileSync(suspiciousFile, content);
    console.log('Fixed', suspiciousFile);
}

// 2. Fix Billing Page
if (fs.existsSync(billingFile)) {
    let content = fs.readFileSync(billingFile, 'utf8');

    // Replace root background
    content = content.replace(
        /className="min-h-screen bg-\[\#f8fafc\]"/g,
        'className="min-h-screen bg-slate-50 dark:bg-[#020617] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900/40 dark:via-[#020617] dark:to-[#020617]"'
    );
    content = content.replace(
        /className="p-12 space-y-8 animate-pulse bg-slate-50 min-h-screen"/g,
        'className="p-12 space-y-8 animate-pulse min-h-screen bg-slate-50 dark:bg-[#020617] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900/40 dark:via-[#020617] dark:to-[#020617]"'
    );

    // Add dark modes for bg-white
    content = content.replace(/bg-white/g, 'bg-white dark:bg-[#0f172a]');

    // Add dark modes for borders
    content = content.replace(/border-slate-100/g, 'border-slate-100 dark:border-white/5');
    content = content.replace(/border-slate-200/g, 'border-slate-200 dark:border-white/5');

    // Add dark modes for texts
    content = content.replace(/text-slate-800/g, 'text-slate-800 dark:text-white');
    content = content.replace(/text-slate-700/g, 'text-slate-700 dark:text-slate-200');
    content = content.replace(/text-slate-600/g, 'text-slate-600 dark:text-slate-300');
    content = content.replace(/text-slate-500/g, 'text-slate-500 dark:text-slate-400');
    content = content.replace(/text-slate-400/g, 'text-slate-400 dark:text-slate-500');

    // Let's fix some specific backgrounds that might have been broken by bg-white dark:bg-[#0f172a]
    content = content.replace(/bg-white dark:bg-\[\#0f172a\]\/5/g, 'bg-white/5 dark:bg-white/5');
    content = content.replace(/bg-white dark:bg-\[\#0f172a\]\/10/g, 'bg-white/10 dark:bg-white/10');
    content = content.replace(/bg-white dark:bg-\[\#0f172a\]\/20/g, 'bg-white/20 dark:bg-white/20');
    content = content.replace(/bg-white dark:bg-\[\#0f172a\]\/30/g, 'bg-white/30 dark:bg-white/30');

    // Let's fix text-white replacing correctly in suspicious if we did anything, but we only did it in billing

    fs.writeFileSync(billingFile, content);
    console.log('Fixed', billingFile);
}
