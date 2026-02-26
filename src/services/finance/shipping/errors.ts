export class ShippingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ShippingError';
    }
}

export class IdempotencyError extends ShippingError {
    constructor(message: string = 'Idempotency conflict detected.') {
        super(message);
        this.name = 'IdempotencyError';
    }
}

export class ReconcileError extends ShippingError {
    constructor(message: string) {
        super(message);
        this.name = 'ReconcileError';
    }
}
