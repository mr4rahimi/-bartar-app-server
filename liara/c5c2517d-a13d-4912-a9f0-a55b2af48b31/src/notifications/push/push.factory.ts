import { PushProvider } from '../providers/push.provider';
import { StubPushProvider } from './stub.provider';
import { FcmPushProvider } from './fcm.provider';

export function createPushProvider(): PushProvider {
  const provider = (process.env.PUSH_PROVIDER || process.env.FCM_PROVIDER || 'stub').toLowerCase();
  if (provider === 'fcm') return new FcmPushProvider();
  return new StubPushProvider();
}
