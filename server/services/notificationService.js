const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize the admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Function to send a notification via Expo's Push API
async function sendPushNotification(expoPushToken, title, body, data = {}) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

// Send notification for friend request
async function sendFriendRequestNotification(requesterId, recipientId) {
  try {
    // Get requester's data
    const requesterDoc = await db.collection('users').doc(requesterId).get();
    const requesterData = requesterDoc.data();
    
    // Get recipient's data including push token
    const recipientDoc = await db.collection('users').doc(recipientId).get();
    const recipientData = recipientDoc.data();
    
    if (recipientData.expoPushToken) {
      await sendPushNotification(
        recipientData.expoPushToken,
        'New Friend Request',
        `${requesterData.displayName || 'Someone'} wants to be your friend!`,
        {
          type: 'friendRequest',
          requesterId
        }
      );
    }
  } catch (error) {
    console.error('Error sending friend request notification:', error);
  }
}

// Send notification for challenge request
async function sendChallengeNotification(challengerId, recipientId, challengeId) {
  try {
    // Get challenger's data
    const challengerDoc = await db.collection('users').doc(challengerId).get();
    const challengerData = challengerDoc.data();
    
    // Get recipient's data including push token
    const recipientDoc = await db.collection('users').doc(recipientId).get();
    const recipientData = recipientDoc.data();
    
    if (recipientData.expoPushToken) {
      await sendPushNotification(
        recipientData.expoPushToken,
        'New Challenge!',
        `${challengerData.displayName || 'Someone'} has challenged you to a game!`,
        {
          type: 'challenge',
          challengerId,
          challengeId
        }
      );
    }
  } catch (error) {
    console.error('Error sending challenge notification:', error);
  }
}

module.exports = {
  sendPushNotification,
  sendFriendRequestNotification,
  sendChallengeNotification
}; 