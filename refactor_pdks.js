const fs = require('fs');

const file = 'src/app/(app)/staff/pdks/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

// Update background to match Enterprise SaaS global standards
txt = txt.replace(/min-h-screen bg-\[#020617\] bg-\[radial-gradient\(ellipse_at_top,_var\(--tw-gradient-stops\)\)\] from-slate-900\/40 via-\[#020617\] to-\[#020617\]/g, 'min-h-screen bg-[#0f172a]');
txt = txt.replace(/bgPage = isLight \? 'min-h-screen bg-slate-50' : 'min-h-screen bg-\[#0f172a\]'/g, "bgPage = isLight ? 'min-h-screen bg-app' : 'min-h-screen bg-[#0f172a]'");
txt = txt.replace(/bg-app/g, "bg-[#F6F8FB]");

txt = txt.replace(/bgCard = isLight \? 'bg-white border-slate-200' : 'bg-\[#0f172a\] border-white\/5'/g, "bgCard = isLight ? 'bg-white border-slate-200' : 'bg-[#1e293b] border-slate-800'");
txt = txt.replace(/bgSurface = isLight \? 'bg-slate-50 border-slate-200' : 'bg-\[#1e293b\] border-white\/5'/g, "bgSurface = isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f172a] border-slate-800'");
txt = txt.replace(/borderColor = isLight \? 'border-slate-200' : 'border-white\/5'/g, "borderColor = isLight ? 'border-slate-200' : 'border-slate-800'");

// Remove 18px and 24px and replace with 20px where appropriate for cards
txt = txt.replace(/rounded-\[24px\]/g, "rounded-[20px]");
txt = txt.replace(/rounded-\[18px\]/g, "rounded-[20px]");

// Adjust colors for primary buttons & hover states
txt = txt.replace(/hover:bg-blue-500\/30/g, "hover:bg-blue-600/20");
txt = txt.replace(/bg-\[#0b1120\]/g, "bg-[#0f172a]");

// Replace text-slate-...
txt = txt.replace(/text-slate-400 font-medium hover:bg-white\/5/g, 'text-slate-400 font-medium hover:bg-slate-800');

fs.writeFileSync(file, txt, 'utf8');
console.log('Pdks refactored');
