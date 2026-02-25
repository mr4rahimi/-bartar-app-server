export type SmsSendRequest = {
  to: string; // E.164 e.g. +98912...
  patternCode: string;
  params: Record<string, string | number>;
};

export type SmsSendResult = {
  provider: string; // "stub" | "ippanel"
  success: boolean;
  messageId?: number;
  error?: string;
};

export interface SmsProvider {
  readonly name: string;
  sendPattern(req: SmsSendRequest): Promise<SmsSendResult>;
}
