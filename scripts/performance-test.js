import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 }, // scale up to 20 users
        { duration: '1m', target: 20 },  // stay at 20 users
        { duration: '30s', target: 0 },  // scale down
    ],
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
    const params = {
        headers: {
            'Content-Type': 'application/json',
            // In real scenario, add Cookie: session=...
        },
    };

    // Test dashboard insights (now cached)
    let res = http.get(`${BASE_URL}/api/user/insights`, params);
    check(res, { 'insights status is 200': (r) => r.status === 200 });

    // Test product list (now paginated)
    res = http.get(`${BASE_URL}/api/products?limit=20`, params);
    check(res, { 'products status is 200': (r) => r.status === 200 });

    sleep(1);
}
