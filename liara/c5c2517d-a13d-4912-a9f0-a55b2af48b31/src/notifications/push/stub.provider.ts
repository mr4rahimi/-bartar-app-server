import { PushProvider, PushSendRequest, PushSendResult } from '../providers/push.provider';

export class StubPushProvider implements PushProvider {
  readonly name = 'stub';

  async send(req: PushSendRequest): Promise<PushSendResult> {
    console.log('[PUSH:STUB]', {
      tokens: req.tokens,
      title: req.title,
      body: req.body,
      data: req.data,
    });

    return {
      provider: this.name,
      successCount: req.tokens.length,
      failureCount: 0,
    };
  }
}
