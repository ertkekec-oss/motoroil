import axios from 'axios';

async function testLogin(username: string, password: string, isTest: boolean) {
    const url = isTest ? 'https://apitest.nilvera.com/general/Login' : 'https://api.nilvera.com/general/Login';
    try {
        const response = await axios.post(url, {
            UserName: username,
            Password: password
        });
        console.log("Login success:", !!response.data);
        console.log("Token:", response.data.replace(/Bearer /i, '').substring(0, 10) + '...');
    } catch(e: any) {
        console.log("Login failed:", e.response?.status, e.response?.data || e.message);
    }
}
testLogin('test01@nilvera.com', '123456', true);
