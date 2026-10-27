/**
 * config/firebase.js
 *
 * Initializes the Firebase Admin SDK using environment variables.
 * Falls back gracefully in development if credentials are not yet configured.
 */

const admin = require('firebase-admin');

let isInitialized = false;
const apps = admin.apps || [];

if (!apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (
    projectId &&
    projectId !== 'your_firebase_project_id' &&
    clientEmail &&
    clientEmail !== 'your_service_account_email@project.iam.gserviceaccount.com' &&
    privateKey &&
    privateKey.length > 20
  ) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      isInitialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (err) {
      console.warn('⚠️ Firebase Admin initialization failed:', err.message);
    }
  } else {
    console.warn('⚠️ Firebase credentials not configured in backend/.env.');
    console.warn('   Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.');
  }
}

module.exports = {
  admin,
  isInitialized: () => Boolean((admin.apps || []).length && isInitialized),
};
