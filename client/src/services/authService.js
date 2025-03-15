import { generateAndUploadAvatar } from './avatarService';

// Find the function that handles user signup and modify it
export async function signUp(email, password, username) {
  try {
    // Create the user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Generate and upload avatar
    const avatarUrl = await generateAndUploadAvatar(user.uid);
    
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      username,
      email,
      avatarUrl,
      createdAt: serverTimestamp(),
      // other user fields...
    });
    
    return user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
} 