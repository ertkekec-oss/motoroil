import { NetworkDisputeStatus } from '@prisma/client';
import { ApiError } from '@/lib/api-context';

/**
 * Valid state transitions for the Dispute & Evidence Engine.
 */
const VALID_TRANSITIONS: Record<NetworkDisputeStatus, NetworkDisputeStatus[]> = {
    [NetworkDisputeStatus.OPEN]: [
        NetworkDisputeStatus.EVIDENCE_PENDING,
        NetworkDisputeStatus.WAITING_COUNTERPARTY,
        NetworkDisputeStatus.UNDER_REVIEW,
        NetworkDisputeStatus.CLOSED,
        NetworkDisputeStatus.REJECTED,
    ],
    [NetworkDisputeStatus.EVIDENCE_PENDING]: [
        NetworkDisputeStatus.WAITING_COUNTERPARTY,
        NetworkDisputeStatus.UNDER_REVIEW,
        NetworkDisputeStatus.CLOSED,
    ],
    [NetworkDisputeStatus.WAITING_COUNTERPARTY]: [
        NetworkDisputeStatus.UNDER_REVIEW,
        NetworkDisputeStatus.ADMIN_REVIEW,
        NetworkDisputeStatus.CLOSED,
    ],
    [NetworkDisputeStatus.UNDER_REVIEW]: [
        NetworkDisputeStatus.WAITING_COUNTERPARTY,
        NetworkDisputeStatus.ADMIN_REVIEW,
        NetworkDisputeStatus.EVIDENCE_PENDING,
        NetworkDisputeStatus.RESOLVED,
        NetworkDisputeStatus.REJECTED,
        NetworkDisputeStatus.CLOSED,
    ],
    [NetworkDisputeStatus.ADMIN_REVIEW]: [
        NetworkDisputeStatus.RESOLVED,
        NetworkDisputeStatus.REJECTED,
        NetworkDisputeStatus.CLOSED,
        NetworkDisputeStatus.EVIDENCE_PENDING, // Admin requests more evidence
    ],
    [NetworkDisputeStatus.RESOLVED]: [], // Terminal State
    [NetworkDisputeStatus.REJECTED]: [], // Terminal State
    [NetworkDisputeStatus.CLOSED]: [],   // Terminal State
};

export class DisputeStateMachine {
    /**
     * Checks if a transition from currentState to targetState is valid.
     * Throws INVALID_DISPUTE_TRANSITION if invalid.
     */
    static validateTransition(currentState: NetworkDisputeStatus, targetState: NetworkDisputeStatus): void {
        if (currentState === targetState) {
            return; // No-op
        }

        const allowed = VALID_TRANSITIONS[currentState] || [];
        if (!allowed.includes(targetState)) {
            throw new ApiError(
                `Cannot transition dispute from ${currentState} to ${targetState}.`,
                400,
                'INVALID_DISPUTE_TRANSITION'
            );
        }
    }

    /**
     * Checks if a dispute is in a terminal state (cannot be further modified).
     */
    static isTerminalState(state: NetworkDisputeStatus): boolean {
        const terminalStates: NetworkDisputeStatus[] = [
            NetworkDisputeStatus.RESOLVED,
            NetworkDisputeStatus.REJECTED,
            NetworkDisputeStatus.CLOSED
        ];
        return terminalStates.includes(state);
    }
}

