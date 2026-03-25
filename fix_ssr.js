const fs = require('fs');
const file = 'src/app/(app)/catalog/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(/onError=\{\(e: any\) => \(\{.*display: 'none'.*\}\)\}/g, '');
txt = txt.replace(/onError=\{\(e: any\) =>\s*.*?display\s*=\s*'none'.*?\}/g, '');
txt = txt.replaceAll('onError={(e: any) => (e.target.style.display = "none")}', '');
console.log(txt.includes('onError'));
fs.writeFileSync(file, txt);
