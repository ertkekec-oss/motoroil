const crypto = require('crypto');
const API_URL = 'https://api.trendyol.com/sapigw/suppliers/519842/settlements?orderNumber=11069830379'; 

async function start() {
    console.log("Fetching Trendyol settlements...");
    const base64Auth = Buffer.from('x:y').toString('base64');
    try {
        const res = await fetch(API_URL, {
            headers: {
                // Not actually hitting the real API because we don't have the auth tokens here.
                // We shouldn't hit the real APIs. 
            }
        });
    } catch(e) {}
}
start();
