const fs = require('fs');

const filePath = "src/app/(app)/customers/[id]/CustomerDetailClient.tsx";
let content = fs.readFileSync(filePath, "utf-8");

let count = 0;

// Replace 1
const str1 = `                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>`;
const repl1 = `                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[4000] flex items-center justify-center p-4 animate-in fade-in duration-200">`;

if (content.includes(str1)) {
    content = content.replace(str1, repl1);
    count++;
}

// Replace 2
const str2 = `                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>`;
const repl2 = `                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[4000] flex items-center justify-center p-4 animate-in fade-in duration-200">`;

if (content.includes(str2)) {
    content = content.replace(str2, repl2);
    count++;
}

// Replace 3 and 4
const str3 = `                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>`;
const repl3 = `                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[6000] flex items-center justify-center p-4 animate-in fade-in duration-200">`;

while (content.includes(str3)) {
    content = content.replace(str3, repl3);
    count++;
}

fs.writeFileSync(filePath, content, "utf-8");
console.log("Replaced wrapper divs: " + count);
