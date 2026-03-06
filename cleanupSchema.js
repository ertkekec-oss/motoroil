const fs = require('fs');
let str = fs.readFileSync('prisma/schema.prisma', 'utf8');

// The script added it at the end. We can just revert the script's addition.
const marker = 'enum ReconciliationDisputeStatus {';
const lastIndex = str.lastIndexOf(marker);
if (lastIndex !== -1 && lastIndex > str.indexOf(marker)) {
    // If it appears more than once, remove the last occurrence
    str = str.substring(0, lastIndex);
    fs.writeFileSync('prisma/schema.prisma', str, 'utf8');
    console.log('Removed duplicate from end');
} else if (lastIndex !== -1 && lastIndex === str.indexOf(marker)) {
    // Just added once but still complaining about model duplicate?
    // Maybe model ReconciliationDispute already exists without the enum?
}

const lines = fs.readFileSync('prisma/schema.prisma', 'utf8').split('\n');
const disputeLine = lines.findIndex(l => l.includes('model ReconciliationDispute {'));
const disputeLineLast = lines.findLastIndex(l => l.includes('model ReconciliationDispute {'));

if (disputeLine !== disputeLineLast) {
    console.log('Duplicate model found at line ' + disputeLine + ' and ' + disputeLineLast);
    // remove the last one and its following lines until }
    str = fs.readFileSync('prisma/schema.prisma', 'utf8');
    str = str.substring(0, str.lastIndexOf('model ReconciliationDispute {'));
    fs.writeFileSync('prisma/schema.prisma', str, 'utf8');
} else {
    console.log('No duplicate model ReconciliationDispute found. Single instance at ' + disputeLine);
}
