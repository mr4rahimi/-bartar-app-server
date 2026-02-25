import * as admin from 'firebase-admin';

let initialized = false;

export function initFirebaseAdmin() {
  if (initialized) return;
  const app = admin.apps.length
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });

  initialized = true;
  return app;
}

export async function sendFcmMulticast(params: {
  tokens: string[];
  title?: string;
  body: string;
  data?: Record<string, string>;
}) {
  initFirebaseAdmin();

  // admin SDK دیتا رو string می‌خواد
  const data: Record<string, string> | undefined = params.data
    ? Object.fromEntries(Object.entries(params.data).map(([k, v]) => [k, String(v)]))
    : undefined;

  const message: admin.messaging.MulticastMessage = {
    tokens: params.tokens,
    notification: {
      title: params.title,
      body: params.body,
    },
    data,
    android: {
      priority: 'high',
    },
  };

  return admin.messaging().sendEachForMulticast(message);
}
