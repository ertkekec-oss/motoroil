export type SmsSendResult = {
    provider: string
    messageId?: string
}

export interface SmsProvider {
    send(toE164: string, message: string): Promise<SmsSendResult>
}
