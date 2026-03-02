// lib/firebaseAdmin.js
// Firebase Admin SDK for server-side operations (webhooks, payment session mapping).
// Requires FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS env var.

import admin from "firebase-admin";

let adminDb = null;

function getAdminDb() {
  if (adminDb) return adminDb;
  if (admin.apps.length === 0) {
    const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (saJson) {
      try {
        const sa = JSON.parse(saJson);
        admin.initializeApp({ credential: admin.credential.cert(sa) });
      } catch (e) {
        console.error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON", e.message);
      }
    } else if (credPath) {
      admin.initializeApp({ credential: admin.credential.cert(credPath) });
    } else {
      try {
        admin.initializeApp();
      } catch (e) {
        console.error("Firebase Admin init failed - set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS", e.message);
      }
    }
  }
  adminDb = admin.firestore();
  return adminDb;
}

export { getAdminDb };
