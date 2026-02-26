export class PayoutError extends Error {
    constructor(public message: string, public code: string, public statusCode: number = 400) {
        super(message);
        this.name = 'PayoutError';
    }
}
