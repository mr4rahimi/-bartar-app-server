import { SmsProvider } from './sms.provider';
import { StubSmsProvider } from './stub-sms.provider';
import { IppanelSmsProvider } from './ippanel-sms.provider';
export function createSmsProvider(): SmsProvider {
  const enabled = (process.env.SMS_ENABLED || 'false').toLowerCase() === 'true';
  if (!enabled) return new StubSmsProvider();

  const provider = (process.env.SMS_PROVIDER || 'stub').toLowerCase();
  if (provider === 'ippanel') return new IppanelSmsProvider();

  return new StubSmsProvider();
}
