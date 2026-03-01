const fs = require('fs');
const path = require('path');

const dir = 'src/app/(app)/inventory';

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let txt = fs.readFileSync(filePath, 'utf8');
    let originalTxt = txt;

    // 1. Remove Orange/Gradient classes
    txt = txt.replace(/bg-\[#FF5500\]/g, 'bg-blue-600 hover:bg-blue-700');
    txt = txt.replace(/text-\[#FF5500\]/g, 'text-blue-600');
    txt = txt.replace(/bg-gradient-to-[a-z]+ from-orange-[0-9]+ to-orange-[0-9]+/g, 'bg-blue-600 hover:bg-blue-700');
    txt = txt.replace(/bg-gradient-to-[a-z]+ from-blue-[0-9]+ to-blue-[0-9]+/g, 'bg-blue-600 hover:bg-blue-700');

    // 2. Remove glows/shadows
    txt = txt.replace(/shadow-\[[^\]]+rgba\(255,85,0,[^\]]+\]/g, 'shadow-sm');
    txt = txt.replace(/shadow-\[[^\]]+rgba\(37,99,235,[^\]]+\]/g, 'shadow-sm'); // remove blue intense glow

    // KPI Strip: remove metallic
    txt = txt.replace(/bg-gradient-to-b from-\[#ffffff\]\/96 to-\[#f8fafc\]\/88 border-\[#0f172a\]\/5 dark:from-\[#0f172a\]\/75 dark:to-\[#0f172a\]\/55 dark:border-blue-400\/15/g, 'bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 shadow-sm');
    txt = txt.replace(/bg-gradient-to-r from-emerald-500\/0 via-emerald-500\/10 to-emerald-500\/0/g, 'bg-emerald-500/10');

    // Critical Stock Panel
    txt = txt.replace(/from-red-500\/10 to-red-500\/5 border-red-500\/20/g, 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900 shadow-sm');

    // Modals
    txt = txt.replace(/rounded-3xl/g, 'rounded-[24px]');
    txt = txt.replace(/rounded-2xl/g, 'rounded-[20px]'); // specific for cards as required

    // Header Buttons
    txt = txt.replace(/bg-subtle/g, 'bg-white dark:bg-[#111c30] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-[#1e293b]');

    // Remove glass styling across elements where applied in a non-enterprise way
    txt = txt.replace(/glass-plus/g, 'bg-white dark:bg-[#0f172a] shadow-sm');

    if (txt !== originalTxt) {
        fs.writeFileSync(filePath, txt, 'utf8');
        console.log('Updated ' + filePath);
    }
}

function processDirectory(directory) {
    if (!fs.existsSync(directory)) return;
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (fullPath !== 'src/app/(app)/inventory/variants') {
                processDirectory(fullPath);
            }
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

processDirectory(dir);
processFile('src/app/(app)/inventory/page.tsx');
console.log('Refactoring script finished.');
