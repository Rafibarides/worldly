const path = require('path');
require('dotenv').config();

const admin = require('firebase-admin');

// Try to load from environment variable first
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.log('Using service account from environment variable');
  } catch (error) {
    console.error('Error parsing service account JSON from environment:', error);
    process.exit(1);
  }
} else {
  // Fall back to file
  const serviceAccountPath = path.resolve(
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
    './wordly-app-b86b5-firebase-adminsdk-fbsvc-32db643035.json'
  );
  try {
    serviceAccount = require(serviceAccountPath);
    console.log(`Using service account from file: ${serviceAccountPath}`);
  } catch (error) {
    console.error(`Error loading service account from ${serviceAccountPath}:`, error);
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

async function seedCollection(collectionName, dataArray) {
  const batch = db.batch();
  dataArray.forEach((item) => {
    // Create a new document with auto-generated ID
    const docRef = db.collection(collectionName).doc();
    batch.set(docRef, item);
  });
  await batch.commit();
  console.log(`Seeded ${collectionName} collection with ${dataArray.length} documents.`);
}

async function seedFirestore() {
  try {
    await seedCollection("badges", badges);
    await seedCollection("challenges", challenges);
    await seedCollection("friendships", friendships);
    await seedCollection("gameCountries", gameCountries);
    await seedCollection("gameParticipants", gameParticipants);
    await seedCollection("games", games);
    await seedCollection("notifications", notifications);
    await seedCollection("userBadges", userBadges);
    await seedCollection("admin", users);
    console.log("Firestore seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding Firestore: ", error);
    process.exit(1);
  }
}

seedFirestore(); 