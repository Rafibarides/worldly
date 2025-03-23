const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendFriendRequestNotification, sendChallengeNotification } = require('./notificationService');

// Initialize the admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Trigger when a new friend request is created
exports.onFriendRequestCreated = functions.firestore
  .document('friendships/{friendshipId}')
  .onCreate(async (snapshot, context) => {
    const friendshipData = snapshot.data();
    
    // Only trigger for pending requests (not auto-accepted)
    if (friendshipData.status === 'pending') {
      await sendFriendRequestNotification(
        friendshipData.requesterId, 
        friendshipData.recipientId
      );
    }
    
    return null;
  });

// Trigger when a new challenge is created
exports.onChallengeCreated = functions.firestore
  .document('challenges/{challengeId}')
  .onCreate(async (snapshot, context) => {
    const challengeData = snapshot.data();
    const challengeId = context.params.challengeId;
    
    console.log('Challenge created:', { 
      challengeId, 
      challengerID: challengeData.challengerId,
      recipientID: challengeData.recipientId || challengeData.challengedId
    });
    
    // Check for required fields
    if (!challengeData.challengerId || !(challengeData.recipientId || challengeData.challengedId)) {
      console.error('Missing challenge data fields:', challengeData);
      return null;
    }
    
    // Some challenges might use recipientId, others might use challengedId
    const recipientId = challengeData.recipientId || challengeData.challengedId;
    
    // Send notification to the recipient
    await sendChallengeNotification(
      challengeData.challengerId,
      recipientId,
      challengeId
    );
    
    return null;
  }); 