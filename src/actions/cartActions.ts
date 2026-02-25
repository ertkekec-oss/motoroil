"use server";

import { cookies } from "next/headers";

type CartItem = {
    productId: string;
    sellerCompanyId: string;
    qty: number;
};

export async function addToCartAction(data: { productId: string; sellerCompanyId: string; qty: number }) {
    const cStore = await cookies();
    const cartCookie = cStore.get("b2b_cart");
    let cart: CartItem[] = [];

    if (cartCookie?.value) {
        try {
            cart = JSON.parse(cartCookie.value);
        } catch (e) {
            cart = [];
        }
    }

    const existingId = cart.findIndex(item => item.productId === data.productId && item.sellerCompanyId === data.sellerCompanyId);

    if (existingId > -1) {
        cart[existingId].qty += data.qty;
    } else {
        cart.push(data);
    }

    cStore.set("b2b_cart", JSON.stringify(cart), { maxAge: 60 * 60 * 24 * 7, path: "/" });

    return { success: true, cartSize: cart.length };
}

export async function getCartAction() {
    const cStore = await cookies();
    const cartCookie = cStore.get("b2b_cart");
    if (!cartCookie?.value) return [];
    try {
        return JSON.parse(cartCookie.value) as CartItem[];
    } catch {
        return [];
    }
}

export async function clearCartAction() {
    const cStore = await cookies();
    cStore.delete("b2b_cart");
    return { success: true };
}

export async function updateCartItemQtyAction(productId: string, sellerCompanyId: string, qty: number) {
    const cStore = await cookies();
    const cartCookie = cStore.get("b2b_cart");
    if (!cartCookie?.value) return { success: false };

    let cart: CartItem[] = [];
    try {
        cart = JSON.parse(cartCookie.value);
    } catch {
        return { success: false };
    }

    if (qty <= 0) {
        cart = cart.filter(item => !(item.productId === productId && item.sellerCompanyId === sellerCompanyId));
    } else {
        const idx = cart.findIndex(item => item.productId === productId && item.sellerCompanyId === sellerCompanyId);
        if (idx > -1) {
            cart[idx].qty = qty;
        }
    }

    cStore.set("b2b_cart", JSON.stringify(cart), { maxAge: 60 * 60 * 24 * 7, path: "/" });
    return { success: true };
}
