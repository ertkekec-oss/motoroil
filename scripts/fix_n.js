const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// The literal issue is `            )}\\n`
content = content.replace(")}\\n", ")}");
content = content.replace(")}\\n\\n", ")}");
content = content.replace("\\n \\n \\n", "");

fs.writeFileSync(file, content);
console.log('Fixed \\n');
