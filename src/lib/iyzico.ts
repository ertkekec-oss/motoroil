
import Iyzipay from 'iyzipay';

const iyzipay = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY || 'sandbox-key',
    secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-secret',
    uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
});

export type CheckoutFormRequest = {
    callbackUrl: string;
    pricingPlanCode: string;
    subscriptionAddress: {
        contactName: string;
        city: string;
        country: string;
        address: string;
        zipCode?: string;
    };
    customer: {
        name: string;
        surname: string;
        email: string;
        gsmNumber: string;
        identityNumber: string;
        billingAddress: {
            contactName: string;
            city: string;
            country: string;
            address: string;
            zipCode?: string;
        };
    };
};

export const iyzico = {
    /**
     * Abonelik Checkout Formu Başlatır
     */
    initializeSubscriptionCheckout: (request: CheckoutFormRequest): Promise<any> => {
        return new Promise((resolve, reject) => {
            iyzipay.subscriptionCheckoutForm.initialize(request, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    },

    /**
     * Checkout Form Sonucunu Getirir (Token ile)
     */
    getSubscriptionCheckoutResult: (token: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            iyzipay.subscriptionCheckoutForm.retrieve({ checkoutFormToken: token }, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    },

    /**
     * Abonelik Detaylarını Getirir
     */
    getSubscription: (subscriptionReferenceCode: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            iyzipay.subscription.retrieve({ subscriptionReferenceCode }, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }
};
