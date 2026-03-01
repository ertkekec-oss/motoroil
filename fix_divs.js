const fs = require('fs');

let content = fs.readFileSync('src/components/StaffManagementContent.tsx', 'utf8');

// Insert the two closing divs for 'CONTENT AREA' and 'max-w-1600px'
content = content.replace(
    /(\s*\{\/\*\s*4\.\s*EDIT STAFF MODAL\s*\*\/\})/,
    "\n                </div>\n            </div>\n$1"
);

fs.writeFileSync('src/components/StaffManagementContent.tsx', content);
console.log('Fixed missing closing divs before modals.');
