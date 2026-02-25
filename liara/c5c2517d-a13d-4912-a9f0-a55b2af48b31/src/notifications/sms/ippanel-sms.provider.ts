import { SmsProvider, SmsSendRequest, SmsSendResult } from './sms.provider';

export class IppanelSmsProvider implements SmsProvider {
  readonly name = 'ippanel';

  async sendPattern(req: SmsSendRequest): Promise<SmsSendResult> {
    const baseUrl = process.env.SMS_BASE_URL || '';
    const token = process.env.SMS_API_TOKEN || '';
    const from = process.env.SMS_FROM_NUMBER || '';

    if (!baseUrl || !token || !from) {
      return {
        provider: this.name,
        success: false,
        error: 'MISSING_SMS_ENV(SMS_BASE_URL/SMS_API_TOKEN/SMS_FROM_NUMBER)',
      };
    }

    const url = `${baseUrl.replace(/\/$/, '')}/api/send`;

    const body = {
      sending_type: 'pattern',
      from_number: from,
      code: req.patternCode,
      recipients: [req.to],
      params: Object.fromEntries(Object.entries(req.params).map(([k, v]) => [k, String(v)])),
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify(body),
      });

      const json: any = await res.json().catch(() => null);

      if (!res.ok || !json?.meta?.status) {
        return {
          provider: this.name,
          success: false,
          error: `IPPANEL_ERROR status=${res.status} body=${JSON.stringify(json)}`,
        };
      }

      const id = json?.data?.message_outbox_ids?.[0];
      return { provider: this.name, success: true, messageId: id };
    } catch (e: any) {
      return { provider: this.name, success: false, error: e?.message || String(e) };
    }
  }
}
