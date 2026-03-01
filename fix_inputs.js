const fs = require('fs');
let path = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let txt = fs.readFileSync(path, 'utf8');

// Inputs: height 44px, radius 12px
txt = txt.replace(/padding: '16px 20px', borderRadius: '14px'/g, 'height: \'44px\', padding: \'0 16px\', borderRadius: \'12px\'');
txt = txt.replace(/padding: '12px 16px', borderRadius: '12px'/g, 'height: \'44px\', padding: \'0 16px\', borderRadius: \'12px\'');

// Replace Primary Buton Orange
txt = txt.replace(/background: '#f59e0b',\n\s*color: 'white'/g, 'background: \'#3b82f6\', color: \'white\'');
txt = txt.replace(/text-amber-500/g, 'text-blue-500');

// Fix Red buttons to be Outline instead of Filled Solid Red
// In modals we have: background: '#ef4444', color: 'white'
txt = txt.replace(/background: '#ef4444',\n\s*color: 'white'/g, 'background: \'rgba(239, 68, 68, 0.1)\', border: \'1px solid rgba(239, 68, 68, 0.4)\', color: \'#ef4444\'');
// Same if it's in one line
txt = txt.replace(/background: '#ef4444', color: 'white'/g, 'background: \'rgba(239, 68, 68, 0.1)\', border: \'1px solid rgba(239, 68, 68, 0.4)\', color: \'#ef4444\'');

// Primary button heights
txt = txt.replace(/padding: '16px 24px',\n\s*borderRadius: '14px'/g, 'height: \'44px\', padding: \'0 24px\', borderRadius: \'14px\', display: \'flex\', alignItems: \'center\', justifyContent: \'center\'');
txt = txt.replace(/padding: '12px 24px',\n\s*borderRadius: '12px'/g, 'height: \'44px\', padding: \'0 24px\', borderRadius: \'14px\', display: \'flex\', alignItems: \'center\', justifyContent: \'center\'');


fs.writeFileSync(path, txt);
console.log('CustomerDetailClient properties fixed to match form standards');
