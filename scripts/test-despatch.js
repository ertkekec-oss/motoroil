import axios from 'axios';

async function run() {
    const res = await axios.get("https://apitest.nilvera.com/general/GlobalCompany/Check/TaxNumber/6231776841?globalUserType=Despatch", {
        headers: {
            "Authorization": "Bearer 3cc3fac40a6b41c099b244d2d46e3d55"
        }
    });
    console.log(JSON.stringify(res.data, null, 2));
}
run();
