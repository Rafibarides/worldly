import admin from 'firebase-admin';
import fetch from 'node-fetch';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a temporary directory for image processing
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

async function initializeFirebase() {
  console.log('Initializing Firebase Admin SDK...');
  
  try {
    // Use the specific service account file you have
    const serviceAccountPath = './wordly-app-b86b5-firebase-adminsdk-fbsvc-7e09d54a96.json';
    
    // Check if the file exists
    if (!fs.existsSync(serviceAccountPath)) {
      console.error(`ERROR: Service account file not found at ${serviceAccountPath}`);
      process.exit(1);
    }
    
    console.log(`Using service account at: ${serviceAccountPath}`);
    
    // Load the service account
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      console.log(`Successfully loaded service account for project: ${serviceAccount.project_id}`);
    } catch (error) {
      console.error('Error loading service account file:', error.message);
      process.exit(1);
    }
    
    // Initialize the app with the correct service account and bucket name
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'wordly-app-b86b5.firebasestorage.app'  // Use the exact bucket name from your URLs
    });
    
    console.log('Firebase Admin SDK initialized successfully');
    return { db: admin.firestore(), bucket: admin.storage().bucket() };
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    process.exit(1);
  }
}

async function downloadImage(url, filePath) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const buffer = await response.buffer();
    fs.writeFileSync(filePath, buffer);
    return true;
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error.message);
    return false;
  }
}

async function convertToJpg(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    return true;
  } catch (error) {
    console.error(`Error converting image to JPG:`, error.message);
    return false;
  }
}

async function uploadImage(bucket, filePath, destination) {
  try {
    console.log(`Attempting to upload ${filePath} to ${destination}...`);
    
    // Upload the file directly using the bucket.upload method
    const [file] = await bucket.upload(filePath, {
      destination,
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      }
    });
    
    // Make the file publicly accessible
    await file.makePublic();
    
    // Get the public URL using the file's publicUrl method
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/wordly-app-b86b5.firebasestorage.app/o/${encodeURIComponent(destination)}?alt=media`;
    
    console.log(`Successfully uploaded image to: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`Error uploading image:`, error);
    // Log more detailed error information
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    return null;
  }
}

async function convertAvatarsToJpg() {
  console.log('Starting avatar conversion process...');
  
  try {
    // Initialize Firebase
    const { db, bucket } = await initializeFirebase();
    
    // Test Firestore connection
    console.log('Testing Firestore connection...');
    try {
      const testDoc = await db.collection('users').limit(1).get();
      console.log(`Connection successful! Found ${testDoc.size} user(s).`);
    } catch (error) {
      console.error('Failed to connect to Firestore:', error);
      return;
    }
    
    // Get all users from Firestore
    console.log('Fetching all users from Firestore...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} users to process`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    let dicebearConvertedCount = 0;
    
    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      // Skip if no avatarUrl
      if (!userData.avatarUrl) {
        console.log(`User ${userId}: No avatar URL found, skipping`);
        skipCount++;
        continue;
      }
      
      // Check if it's a Dicebear avatar
      const isDicebear = userData.avatarUrl.includes('dicebear.com');
      
      // Skip if already a JPG (check URL ends with .jpg or .jpeg) and not a Dicebear avatar
      const lowerUrl = userData.avatarUrl.toLowerCase();
      if (!isDicebear && (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg'))) {
        console.log(`User ${userId}: Avatar already in JPG format, skipping`);
        skipCount++;
        continue;
      }
      
      console.log(`Processing user ${userId} with avatar: ${userData.avatarUrl}`);
      
      // Download the image
      const originalImagePath = path.join(tempDir, `${userId}_original`);
      const success = await downloadImage(userData.avatarUrl, originalImagePath);
      if (!success) {
        console.error(`Failed to download avatar for user ${userId}`);
        errorCount++;
        continue;
      }
      
      // Convert to JPG
      const jpgImagePath = path.join(tempDir, `${userId}.jpg`);
      const conversionSuccess = await convertToJpg(originalImagePath, jpgImagePath);
      if (!conversionSuccess) {
        console.error(`Failed to convert avatar to JPG for user ${userId}`);
        errorCount++;
        continue;
      }
      
      // Upload the JPG to Firebase Storage
      const storagePath = `avatars/${userId}_${Date.now()}.jpg`;
      const newAvatarUrl = await uploadImage(bucket, jpgImagePath, storagePath);
      if (!newAvatarUrl) {
        console.error(`Failed to upload JPG avatar for user ${userId}`);
        errorCount++;
        continue;
      }
      
      // Update the user document with the new avatar URL
      await db.collection('users').doc(userId).update({
        avatarUrl: newAvatarUrl
      });
      
      if (isDicebear) {
        console.log(`Successfully converted Dicebear avatar for user ${userId}`);
        dicebearConvertedCount++;
      } else {
        console.log(`Successfully updated avatar for user ${userId}`);
      }
      successCount++;
      
      // Clean up temporary files
      try {
        fs.unlinkSync(originalImagePath);
        fs.unlinkSync(jpgImagePath);
      } catch (err) {
        console.warn(`Warning: Could not delete temporary files for user ${userId}`);
      }
    }
    
    console.log('\nConversion process completed!');
    console.log(`Total users processed: ${usersSnapshot.size}`);
    console.log(`Successfully converted: ${successCount}`);
    console.log(`Dicebear avatars converted: ${dicebearConvertedCount}`);
    console.log(`Skipped (already JPG or no avatar): ${skipCount}`);
    console.log(`Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Error in conversion process:', error);
  } finally {
    // Clean up the temp directory
    try {
      fs.rmdirSync(tempDir, { recursive: true });
      console.log('Temporary directory cleaned up');
    } catch (err) {
      console.warn('Warning: Could not clean up temporary directory');
    }
    
    // Exit the process
    process.exit(0);
  }
}

// Run the conversion
convertAvatarsToJpg(); 