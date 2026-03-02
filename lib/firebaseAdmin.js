// lib/firebaseAdmin.js
// Firebase Admin SDK for server-side operations (webhooks, payment session mapping).
// Requires FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS env var.

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let adminDb = null;

function getAdminDb() {
  if (adminDb) return adminDb;
  if (getApps().length === 0) {
    const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (saJson) {
      try {
        const sa = JSON.parse(saJson);
        initializeApp({ credential: cert(sa) });
      } catch (e) {
        console.error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON", e.message);
      }
    } else if (credPath) {
      initializeApp({ credential: cert(credPath) });
    } else {
      // Try default credentials (e.g. in Cloud Run / GCP)
      try {
        initializeApp();
      } catch (e) {
        console.error("Firebase Admin init failed - set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS", e.message);
      }
    }
  }
  adminDb = getFirestore();
  return adminDb;
}

export { getAdminDb };
