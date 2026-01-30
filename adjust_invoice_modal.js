const fs = require('fs');
const path = 'c:\\Users\\Life\\Desktop\\muhasebe app\\motoroil\\src\\app\\customers\\[id]\\CustomerDetailClient.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Widen the invoice modal
// Current: width: '900px', maxWidth: '95vw'
// Target: width: '1200px', maxWidth: '98vw'
// Search for the specific div style of the invoice modal.
// Identifying feature: It contains "RESMİ FATURALANDIRMA SİSTEMİ" inside it, but the style is on the container.
// The container line looks like: <div className="card glass animate-in" style={{ width: '900px', maxWidth: '95vw', ... }}>

const modalStyleCurent = "width: '900px', maxWidth: '95vw'";
const modalStyleNew = "width: '1200px', maxWidth: '98vw'";

if (content.includes(modalStyleCurent)) {
    content = content.replace(modalStyleCurent, modalStyleNew);
    console.log('Widened invoice modal.');
} else {
    console.log('Could not find exact modal style string to replace. Trying regex.');
    // Fallback regex
    const regex = /width:\s*'900px',\s*maxWidth:\s*'95vw'/;
    if (regex.test(content)) {
        content = content.replace(regex, "width: '1200px', maxWidth: '98vw'");
        console.log('Widened invoice modal using regex.');
    } else {
        console.log('Could not find modal style with regex either.');
    }
}

// 2. Change Button Text
// Current: FATURAYI ONAYLA & KES ✨
// Target: FATURAYI ONAYLA

const buttonTextCurrent = "FATURAYI ONAYLA & KES ✨";
const buttonTextNew = "FATURAYI ONAYLA";

if (content.includes(buttonTextCurrent)) {
    content = content.replace(buttonTextCurrent, buttonTextNew);
    console.log('Updated button text.');
} else {
    console.log('Could not find button text.');
}

fs.writeFileSync(path, content, 'utf8');
