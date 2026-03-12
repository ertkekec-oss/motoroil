import axios from 'axios';

async function testNilveraTokens(isTest: boolean) {
    const baseUrl = isTest ? 'https://apitest.nilvera.com' : 'https://api.nilvera.com';
    const endpoints = [
        '/Token',
        '/Auth',
        '/Auth/Login',
        '/general/Token',
        '/v1/Token',
        '/v1/Auth/Login'
    ];
    
    for(const ep of endpoints) {
        try {
            console.log("Testing:", ep);
            const res = await axios.post(`${baseUrl}${ep}`, {
                UserName: 'test',
                Password: '123'
            }, { validateStatus: () => true });
            console.log(`  -> Status: ${res.status}`);
            if(res.status !== 404 && res.status !== 405) {
                console.log("  -> Data:", res.data);
            }
        } catch(e: any) {
            console.log(`  -> Error: ${e.message}`);
        }
    }
}
testNilveraTokens(true);
