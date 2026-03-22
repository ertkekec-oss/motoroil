const fs = require('fs');

function patch() {
    let f = fs.readFileSync('src/app/api/network/cart/route.ts', 'utf8');

    // Add availablePoints to the cart summary
    if (!f.includes('availablePoints')) {
        f = f.replace('freeShippingThreshold,\n                    earnablePoints\n                },', 'freeShippingThreshold,\n                    earnablePoints,\n                    availablePoints\n                },');
        f = f.replace('freeShippingThreshold,\r\n                    earnablePoints\r\n                },', 'freeShippingThreshold,\r\n                    earnablePoints,\r\n                    availablePoints\r\n                },');
    }

    fs.writeFileSync('src/app/api/network/cart/route.ts', f);
    console.log("Patched cart response to include availablePoints only once!");
}

patch();
