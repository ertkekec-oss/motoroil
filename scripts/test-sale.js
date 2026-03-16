const fetch = require('node-fetch'); // Needs to be fetch-able, so I'll just use fetch in NextJS env via a small JS snippet or built-in modern node fetch

async function testSale() {
  const payload = {
    items: [],
    total: 100,
    kasaId: "CashKasa",
    paymentMode: "cash",
    customerName: "Test",
    branch: "KAYSERİ"
  };

  try {
     const req = await fetch('https://periodya.com/api/sales/create', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(payload)
     });
     console.log('Status', req.status);
     const res = await req.json();
     console.log(res);
  } catch(e) {
     console.error(e);
  }
}

testSale();
