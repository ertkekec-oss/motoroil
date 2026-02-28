const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/(app)/test-desktop/ClientDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Container width
content = content.replace(/className="max-w-\[1400px\] mx-auto space-y-8 pb-24 pdy-grid"/g, 'className="pdy-content-container max-w-[1400px] mx-auto space-y-8 pb-24 pdy-stack"');
content = content.replace(/className="max-w-\[1400px\] mx-auto space-y-8 pb-24"/g, 'className="pdy-content-container max-w-[1400px] mx-auto space-y-8 pb-24 pdy-stack"');

// Title
content = content.replace(/className="mb-6 xl:mb-8"/g, 'className="mb-6 xl:mb-8 pdy-title"');

// Cards (adding pdy-card if not present)
content = content.replace(/(rounded-\[24px\][^>]*flex flex-col(?! pdy-card)[^"]*)"/g, '$1 pdy-card"');

// KPIs (adding pdy-kpi to text-3xl, 4xl, 5xl, text-2xl inside cards)
content = content.replace(/className="text-2xl font-black([^"]*)"/g, 'className="text-2xl font-black$1 pdy-kpi"');
content = content.replace(/className="text-3xl font-black([^"]*)"/g, 'className="text-3xl font-black$1 pdy-kpi"');
content = content.replace(/className="text-4xl font-black([^"]*)"/g, 'className="text-4xl font-black$1 pdy-kpi"');
content = content.replace(/className="text-5xl font-black([^"]*)"/g, 'className="text-5xl font-black$1 pdy-kpi"');

// pdy-grid-tight inside cards where gap-6 or gap-4 is used as grid
content = content.replace(/grid grid-cols-2 gap-4/g, 'grid grid-cols-2 gap-4 pdy-grid-tight');
content = content.replace(/grid grid-cols-2 gap-6/g, 'grid grid-cols-2 gap-6 pdy-grid-tight');
content = content.replace(/grid grid-cols-1 md:grid-cols-3 gap-6/g, 'grid grid-cols-1 md:grid-cols-3 gap-6 pdy-grid');

// pdy-stack for space-y
content = content.replace(/space-y-4/g, 'space-y-4 pdy-stack');
content = content.replace(/space-y-3/g, 'space-y-3 pdy-stack');

// Prevent double additions
content = content.replace(/pdy-card pdy-card/g, 'pdy-card');
content = content.replace(/pdy-kpi pdy-kpi/g, 'pdy-kpi');
content = content.replace(/pdy-title pdy-title/g, 'pdy-title');
content = content.replace(/pdy-stack pdy-stack/g, 'pdy-stack');
content = content.replace(/pdy-grid pdy-grid/g, 'pdy-grid');
content = content.replace(/pdy-grid-tight pdy-grid-tight/g, 'pdy-grid-tight');

fs.writeFileSync(filePath, content, 'utf8');
console.log('ClientDashboard updated via regex script.');
