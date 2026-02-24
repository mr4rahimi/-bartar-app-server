export type PushSendRequest = {
  tokens: string[];
  title?: string;
  body: string;
  data?: Record<string, any>;
};

export type PushSendResult = {
  provider: string;              // "stub" | "fcm"
  successCount: number;
  failureCount: number;
  errors?: Array<{ token: string; error: string }>;
};

export interface PushProvider {
  readonly name: string;
  send(req: PushSendRequest): Promise<PushSendResult>;
}
