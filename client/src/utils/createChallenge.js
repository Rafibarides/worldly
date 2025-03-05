import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { database } from '../services/firebase';

export async function createChallenge(currentUser, challengedFriend) {
  // Generate a new challenge id (here using the timestamp, but you might use another method)
  const challengeId = Date.now().toString();

  // Create the challenge data with the participants array field included.
  const challengeData = {
    challengerId: currentUser.uid,
    challengedId: challengedFriend.uid,
    participants: [currentUser.uid, challengedFriend.uid],
    status: 'pending',              // Changed from 'active' to 'pending' to be consistent
    createdAt: serverTimestamp(),   // A valid Firestore timestamp
    gameId: `${currentUser.uid}_${challengedFriend.uid}_${Date.now()}`,
    challengerJoined: true,         // Mark that the challenger is in the pending room
    // ... include other fields such as scoreList, game settings, etc.
  };

  // Save the challenge document in Firestore.
  await setDoc(doc(database, 'challenges', challengeId), challengeData);
  
  return challengeId;
} 