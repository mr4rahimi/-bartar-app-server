import { PushProvider, PushSendRequest, PushSendResult } from '../providers/push.provider';
import * as admin from 'firebase-admin';
import * as fs from 'fs';

function envFirst(...keys: string[]) {
  for (const k of keys) {
    const v = process.env[k];
    if (v && v.trim()) return v.trim();
  }
  return '';
}

function loadServiceAccount(): admin.ServiceAccount {
  const json = envFirst('FIREBASE_SERVICE_ACCOUNT_JSON');
  const path = envFirst('FIREBASE_SERVICE_ACCOUNT_PATH', 'GOOGLE_APPLICATION_CREDENTIALS');

  if (json) return JSON.parse(json);

  if (path) {
    const raw = fs.readFileSync(path, 'utf8');
    return JSON.parse(raw);
  }

  throw new Error(
    'Missing FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH (or GOOGLE_APPLICATION_CREDENTIALS)',
  );
}

function getProjectId(serviceAccount: any) {
  return (
    envFirst('FIREBASE_PROJECT_ID', 'FCM_PROJECT_ID') ||
    serviceAccount?.project_id ||
    serviceAccount?.projectId ||
    ''
  );
}

function getOrInitFirebaseApp() {
  if (admin.apps.length) return admin.app();

  const serviceAccount = loadServiceAccount();
  const projectId = getProjectId(serviceAccount);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: projectId || undefined,
  });

  return admin.app();
}

export class FcmPushProvider implements PushProvider {
  readonly name = 'fcm';

  async send(req: PushSendRequest): Promise<PushSendResult> {
    getOrInitFirebaseApp();

    const data: Record<string, string> | undefined = req.data
      ? Object.fromEntries(Object.entries(req.data).map(([k, v]) => [k, String(v)]))
      : undefined;

    const message: admin.messaging.MulticastMessage = {
      tokens: req.tokens,
      notification: { title: req.title, body: req.body },
      data,
      android: { priority: 'high' },
      apns: { headers: { 'apns-priority': '10' } },
    };

    const res = await admin.messaging().sendEachForMulticast(message);

    const errors: Array<{ token: string; error: string }> = [];
    res.responses.forEach((r, i) => {
      if (!r.success) {
        errors.push({
          token: req.tokens[i],
          error: r.error?.message || 'FCM_ERROR',
        });
      }
    });

    return {
      provider: this.name,
      successCount: res.successCount,
      failureCount: res.failureCount,
      errors: errors.length ? errors : undefined,
    };
  }
}
