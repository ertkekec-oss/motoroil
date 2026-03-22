const fs = require('fs');

function patchCart() {
    let f = fs.readFileSync('src/app/api/network/cart/route.ts', 'utf8');

    // Add availablePoints to cart summary return
    f = f.replace('freeShippingThreshold,\n                    earnablePoints\n                },', 'freeShippingThreshold,\n                    earnablePoints,\n                    availablePoints\n                },');

    fs.writeFileSync('src/app/api/network/cart/route.ts', f);
    console.log("Patched cart response to include availablePoints");
}

patchCart();
