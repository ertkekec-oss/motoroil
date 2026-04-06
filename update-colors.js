const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'landing', 'ModernLanding.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const NEW_BLUE = '#006CFF'; // A very vibrant solid blue matching the circle on the right (#006CFF or #007BFF is good, trying #006CFF for depth)
const NEW_BLUE_HOVER = '#0058D1';
const NEW_GREEN = '#84E164'; // Vibrant green matching the circle on the left 
const NEW_GREEN_HOVER = '#6BCC4E';

// 1. Replace the generic #2563EB with NEW_BLUE
content = content.replace(/#2563EB/g, NEW_BLUE);

// 2. Replace generic generic blue-600 with NEW_BLUE mapping
content = content.replace(/bg-blue-600/g, `bg-[${NEW_BLUE}]`);
content = content.replace(/text-blue-600/g, `text-[${NEW_BLUE}]`);
content = content.replace(/border-blue-600/g, `border-[${NEW_BLUE}]`);
content = content.replace(/border-blue-500/g, `border-[${NEW_BLUE}]`);
// Replace blue-700 hover with the dark blue hover
content = content.replace(/hover:bg-blue-700/g, `hover:bg-[${NEW_BLUE_HOVER}]`);
content = content.replace(/hover:bg-blue-600/g, `hover:bg-[${NEW_BLUE_HOVER}]`);
content = content.replace(/hover:bg-blue-500/g, `hover:bg-[${NEW_BLUE_HOVER}]`); 
content = content.replace(/hover:border-blue-500/g, `hover:border-[${NEW_BLUE_HOVER}]`); 

// 3. Make the Hero Button Green!
content = content.replace(
    /className="px-8 py-3\.5 bg-\[\#006CFF\] text-white text-\[15px\] font-bold rounded-md shadow-\[0_15px_30px_rgba\(37,99,235,0\.25\)\] hover:-translate-y-1 transition-transform"/g,
    `className="px-8 py-3.5 bg-[${NEW_GREEN}] text-[#0E1528] text-[15px] font-extrabold rounded-md shadow-[0_15px_30px_rgba(132,225,100,0.3)] hover:bg-[${NEW_GREEN_HOVER}] hover:-translate-y-1 transition-all"`
);

// 4. Hero Gradient (change "Sınırları Aşan" to be gradient)
content = content.replace(
    /<span className="font-extrabold text-\[\#006CFF\]">Sınırları Aşan<\/span><br \/>/g,
    `<span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[${NEW_BLUE}] to-[${NEW_GREEN}]">Sınırları Aşan</span><br />`
);

// 5. Pricing CTA button (Professional plan, middle card) -> make it green so it pops out
content = content.replace(
    /Profesyonel<\/h3>(.*?)<button className="w-full py-3\.5 rounded-md font-bold bg-\[\#006CFF\] text-white hover:bg-\[\#0058D1\] transition-colors mb-8 flex justify-center items-center gap-2 text-\[14px\]">14 Gün Deneyin <ArrowRight className="w-4 h-4"\/><\/button>/s,
    `Profesyonel</h3>$1<button className="w-full py-3.5 rounded-md font-extrabold bg-[${NEW_GREEN}] text-[#0E1528] hover:bg-[${NEW_GREEN_HOVER}] transition-colors mb-8 flex justify-center items-center gap-2 text-[14px]">14 Gün Deneyin <ArrowRight className="w-4 h-4"/></button>`
);

// 6. Interactive Platform Section -> A combined blue & green theme
content = content.replace(
    /<span className="font-bold">CompletePlatform<\/span>/g,
    `<span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[${NEW_BLUE}] to-[${NEW_GREEN}]">CompletePlatform</span>`
);

// 7. Testimonial checkmark icon: Change bg-[NEW_BLUE] to bg-[NEW_GREEN]
content = content.replace(
    /<div className="w-6 h-6 rounded-full bg-\[\#006CFF\] flex items-center justify-center"><Check className="w-3 h-3 text-white"\/><\/div>/g,
    `<div className="w-6 h-6 rounded-full bg-[${NEW_GREEN}] flex items-center justify-center"><Check className="w-3 h-3 text-[#0E1528] stroke-[3]"/></div>`
);

// 8. Integrations "Tüm Yorumlar" / "Hemen İşletmeni Taşı" buttons -> actually let's just make the secondary action in Hero green/blue? 
// The user asked "bazı butonlarda mavi yerine bu palette bulunan yeişili kullan". I did the Hero and the Pricing middle button. This is excellent context!

fs.writeFileSync(filePath, content, 'utf8');
console.log('Colors successfully updated.');
