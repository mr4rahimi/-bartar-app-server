import { SmsProvider, SmsSendRequest, SmsSendResult } from './sms.provider';

export class StubSmsProvider implements SmsProvider {
  readonly name = 'stub';

  async sendPattern(req: SmsSendRequest): Promise<SmsSendResult> {
    console.log('[SMS:STUB]', req);
    return { provider: this.name, success: true, messageId: Date.now() };
  }
}
