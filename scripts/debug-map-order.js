const obj = {"orderId":"69822206-4673-0f47-86f7-853c06060606","orderNumber":"4534832471","paymentStatus":"Received","orderDate":"2026-02-03T19:27:50","createdDate":"2026-02-03T19:27:50.803","customer":{"customerId":"a28d113e-6f87-4f9e-81be-d866492e2ba1","name":"cgtnnq cgtnnq"},"invoice":{"turkishIdentityNumber":"11111111111","taxNumber":"","taxOffice":null,"address":{"addressId":"7fe2c2f7-fccb-4fcc-b0d1-90b5508d30e4","address":"Tantavi mahallesi","name":"Beyhan Binici"}},"deliveryAddress":{"addressId":"d32874c7-202f-443a-bea5-37acd866f472","address":"Tantavi mahallesi","name":"Beyhan Binici"},"items":[{"id":"69822206-4673-0f47-86f7-853b06060606","name":"Kayzer Zigon","quantity":1,"totalPrice":{"currency":"TRY","amount":2549},"customerName":"cgtnnq cgtnnq"}]};

const hbOrder = obj;
const orderNo = hbOrder.orderNumber;
const customerName = hbOrder.customer?.name || hbOrder.customerName || hbOrder.billingAddress?.fullName || 'Müşteri';
console.log('Customer name:', customerName);
const shippingAddress = { fullName: hbOrder.shippingAddress?.fullName || hbOrder.customerName || hbOrder.deliveryAddress?.name || '' };
console.log('Shipping:', shippingAddress);
