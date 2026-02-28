const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/(app)/test-desktop/ClientDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const splitMarker = '{/* R I G H T   P A N E L  (DASHBOARD CARDS 80% SCALED TOKENS) */}';
const parts = content.split(splitMarker);

if (parts.length < 2) {
    console.error('Marker not found');
    process.exit(1);
}

let rightPanel = parts[1];

// Mapping scale downs (approx 10%)
const replacements = [
    [/p-12/g, 'p-10'],
    [/p-8/g, 'p-6'],
    [/p-6/g, 'p-5'],
    [/p-5/g, 'p-4'],
    [/p-4/g, 'p-3.5'],
    
    [/px-12/g, 'px-10'],
    [/px-8/g, 'px-6'],
    [/px-6/g, 'px-5'],
    [/px-4/g, 'px-3.5'],
    
    [/py-10/g, 'py-8'],
    [/py-8/g, 'py-6'],
    [/py-6/g, 'py-5'],
    [/py-5/g, 'py-4'],
    [/py-4/g, 'py-3.5'],

    [/gap-8/g, 'gap-6'],
    [/gap-6/g, 'gap-5'],
    [/gap-4/g, 'gap-3'],
    
    [/mb-10/g, 'mb-8'],
    [/mb-8/g, 'mb-6'],
    [/mb-6/g, 'mb-5'],

    [/text-\[40px\]/g, 'text-[36px]'],
    [/text-\[32px\]/g, 'text-[28px]'],
    [/text-\[28px\]/g, 'text-[25px]'],
    [/text-\[17px\]/g, 'text-[15px]'],
    [/text-\[16px\]/g, 'text-[14.5px]'],
    [/text-\[15px\]/g, 'text-[13.5px]'],
    [/text-\[14px\]/g, 'text-[12.5px]'],
    [/text-\[13px\]/g, 'text-[11.5px]'],
    [/text-\[12px\]/g, 'text-[11px]'],
    [/text-\[11px\]/g, 'text-[10px]'],
    [/text-\[10px\]/g, 'text-[9px]'],
    
    [/\btext-4xl\b/g, 'text-3xl'],
    [/\btext-3xl\b/g, 'text-2xl'],
    [/\btext-2xl\b/g, 'text-xl'],
    [/\btext-xl\b/g, 'text-lg'],

    [/\bw-20 h-20\b/g, 'w-16 h-16'],
    [/\bw-10 h-10\b/g, 'w-8 h-8'],
    [/\bw-6 h-6\b/g, 'w-5 h-5'],
    
    [/h-\[72px\]/g, 'h-[64px]'],
    [/h-\[60px\]/g, 'h-[54px]'],
    [/h-\[52px\]/g, 'h-[46px]'],
];

replacements.forEach(([regex, replacer]) => {
    rightPanel = rightPanel.replace(regex, replacer);
});

fs.writeFileSync(filePath, parts[0] + splitMarker + rightPanel, 'utf-8');
console.log('Successfully scaled down the right panel by ~10%');
