const fs = require('fs');
const envPath = '.env';
let content = fs.readFileSync(envPath, 'utf8');
if (!content.includes('GEMINI_API_KEY')) {
    fs.appendFileSync(envPath, '\n# AI PIM Engine\nGEMINI_API_KEY="AIzaSyBwRS6XUiP1e1efPlqJrOcgm4wTdlcOnZE"\n');
    console.log('Added GEMINI_API_KEY to .env');
} else {
    console.log('Key already exists');
}
