const fs = require('fs');
const content = fs.readFileSync('prisma/schema.prisma', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
    if (line.trim().startsWith('model Order')) {
        console.log(`${index + 1}: ${line}`);
    }
});
