const fs = require('fs');
const path = 'c:\\Users\\Life\\Desktop\\muhasebe app\\motoroil\\prisma\\schema.prisma';

let content = fs.readFileSync(path, 'utf8');

// We want to add fields to Product model.
// Look for `otvType             String?   @default("Ö.T.V yok")`
// And append after it.

const anchor = 'otvType             String?   @default("Ö.T.V yok")';
if (content.includes(anchor)) {
    const newFields = `
  otvType             String?   @default("Ö.T.V yok")
  gtip                String?
  purchaseDiscount    Decimal?  @default(0) @db.Decimal(5, 2)
  otvCode             String?   @default("7")`;

    // Check if already added to avoid duplication (if I ran this mentally before?)
    if (!content.includes('gtipString?')) {
        content = content.replace(anchor, newFields);
        fs.writeFileSync(path, content, 'utf8');
        console.log('Updated schema.prisma with new fields.');
    } else {
        console.log('Fields already appear to be in schema.');
    }
} else {
    console.log('Could not find anchor in schema.prisma');
}
