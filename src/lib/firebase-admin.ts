import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || undefined;

const app =
  getApps().length === 0
    ? initializeApp(projectId ? { projectId } : undefined)
    : getApps()[0];

export const adminAuth = getAuth(app);
