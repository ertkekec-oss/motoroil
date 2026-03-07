export class AdminJobProjection {

    static projectListResponse(jobs: any[]) {
        return jobs.map(j => ({
            id: j.id,
            queue: j.queueName,
            type: j.jobType,
            status: j.status,
            priority: j.priority,
            module: j.moduleScope,
            createdAt: j.createdAt,
            scheduledFor: j.scheduledFor,
            isRetrying: j.retryCount > 0,
            badgeColor: this.resolveStatusColor(j.status)
        }));
    }

    static resolveStatusColor(status: string) {
        if (status === 'SUCCEEDED') return 'green';
        if (status === 'FAILED' || status === 'DEAD_LETTER') return 'red';
        if (status === 'RUNNING') return 'blue';
        if (status === 'RETRYING') return 'orange';
        return 'gray';
    }
}
