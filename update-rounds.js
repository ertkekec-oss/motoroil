const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'landing', 'ModernLanding.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The user specifically wants to reduce roundness on buttons and tabs.
// We previously used rounded-md (6px). Let's reduce it to rounded-sm (2px).
content = content.replace(/rounded-md/g, 'rounded-sm');

// For the bento cards in the active integration tab, we used rounded-[16px]
content = content.replace(/rounded-\[16px\]/g, 'rounded-md');

// For the big tab box, we used rounded-[24px]
content = content.replace(/rounded-\[24px\]/g, 'rounded-md');

// The Hero floating badges might also be too rounded (rounded-2xl to rounded-md)
content = content.replace(/rounded-2xl/g, 'rounded-md');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Reduced box border-radius successfully.');
