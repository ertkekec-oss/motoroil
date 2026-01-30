const fs = require('fs');
const path = 'c:\\Users\\Life\\Desktop\\muhasebe app\\motoroil\\src\\app\\customers\\[id]\\CustomerDetailClient.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Change grid columns from 1fr 1fr to repeat(4, 1fr)
// Identify the div: <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
const gridStart = "gridTemplateColumns: '1fr 1fr'";
const gridNew = "gridTemplateColumns: 'repeat(4, 1fr)'";

if (content.includes(gridStart)) {
    content = content.replace(gridStart, gridNew);
    console.log('Updated grid columns to 4.');
} else {
    console.log('Could not find gridTemplateColumns definition.');
}

// 2. Change Address span from span 2 to span 4
// Identify: <div className="flex-col gap-1" style={{ gridColumn: 'span 2' }}>
// Note: spacing might be tricky.

// Let's use regex for safety.
const addressSpanRegex = /style=\{\{ gridColumn:\s*'span 2'\s*\}\}>/;
if (addressSpanRegex.test(content)) {
    content = content.replace(addressSpanRegex, "style={{ gridColumn: 'span 4' }}>");
    console.log('Updated address span to 4.');
} else {
    console.log('Could not find address span definition.');
}

fs.writeFileSync(path, content, 'utf8');
