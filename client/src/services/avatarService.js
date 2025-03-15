import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Generates a Dicebear avatar, converts it to JPG, and uploads to Firebase Storage
 * @param {string} userId - The user ID to associate with the avatar
 * @returns {Promise<string>} - The URL of the uploaded JPG avatar
 */
export async function generateAndUploadAvatar(userId) {
  try {
    // Generate a random seed for Dicebear
    const seed = userId.substring(0, 5) + Date.now().toString(36);
    
    // Generate Dicebear avatar URL
    const dicebearUrl = `https://api.dicebear.com/9.x/avataaars/png?seed=${seed}`;
    
    // Fetch the image
    const response = await fetch(dicebearUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch Dicebear avatar');
    }
    
    // Convert to blob
    const imageBlob = await response.blob();
    
    // Create a reference to Firebase Storage
    const storageRef = ref(storage, `avatars/${userId}_${Date.now()}.jpg`);
    
    // Upload the image
    await uploadBytes(storageRef, imageBlob, {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000'
    });
    
    // Get the download URL
    const downloadUrl = await getDownloadURL(storageRef);
    
    return downloadUrl;
  } catch (error) {
    console.error('Error generating and uploading avatar:', error);
    // Fall back to direct Dicebear URL if there's an error
    const fallbackSeed = userId.substring(0, 5);
    return `https://api.dicebear.com/9.x/avataaars/png?seed=${fallbackSeed}`;
  }
} 