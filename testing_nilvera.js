const axios = require('axios');
const token = '1D4533A521ED5DB482218907D42D29944502A0CFD12F32EF201860950E0994450';

async function run() {
    try {
        const res = await axios.get('https://apitest.nilvera.com/edespatch/Purchase', {
            headers: {
                Authorization: `Bearer ${token}`
            },
            params: {
                StartDate: '2026-03-01',
                EndDate: '2026-03-14'
            }
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
run();
