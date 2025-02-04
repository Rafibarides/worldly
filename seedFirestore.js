const path = require('path');
require('dotenv').config();

const admin = require('firebase-admin');

const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || './worldly-cfcb5-firebase-adminsdk-fbsvc-2713b61fa6.json');
const serviceAccount = require(serviceAccountPath);

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