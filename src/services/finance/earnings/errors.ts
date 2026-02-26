export enum ErrorCode {
    NOT_FOUND = 'NOT_FOUND',
    ALREADY_RUNNING = 'ALREADY_RUNNING',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    ESCROW_UNAVAILABLE = 'ESCROW_UNAVAILABLE'
}

export class AppError extends Error {
    constructor(public code: ErrorCode, message: string) {
        super(message);
        this.name = 'AppError';
    }
}

export class AlreadyRunningError extends AppError {
    constructor(message: string) {
        super(ErrorCode.ALREADY_RUNNING, message);
        this.name = 'AlreadyRunningError';
    }
}

export class NotFoundError extends AppError {
    constructor(message: string) {
        super(ErrorCode.NOT_FOUND, message);
        this.name = 'NotFoundError';
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(ErrorCode.VALIDATION_ERROR, message);
        this.name = 'ValidationError';
    }
}

export class EscrowUnavailableError extends AppError {
    constructor(message: string) {
        super(ErrorCode.ESCROW_UNAVAILABLE, message);
        this.name = 'EscrowUnavailableError';
    }
}
