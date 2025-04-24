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
    sound: 'chalReq',
    title,
    body,
    data,
    _displayInForeground: false,
    priority: 'high',
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
    // Add validation to prevent empty document paths
    if (!requesterId || !recipientId) {
      console.error('Invalid parameters: requesterId or recipientId is empty', { 
        requesterId, 
        recipientId 
      });
      return;
    }

    // Get requester's data
    const requesterDoc = await db.collection('users').doc(requesterId).get();
    
    if (!requesterDoc.exists) {
      console.error(`Requester document doesn't exist: ${requesterId}`);
      return;
    }
    
    const requesterData = requesterDoc.data();
    
    // Get recipient's data including push token
    const recipientDoc = await db.collection('users').doc(recipientId).get();
    
    if (!recipientDoc.exists) {
      console.error(`Recipient document doesn't exist: ${recipientId}`);
      return;
    }
    
    const recipientData = recipientDoc.data();
    
    if (recipientData.expoPushToken) {
      console.log(`Sending friend request notification to ${recipientId} with token ${recipientData.expoPushToken}`);
      
      await sendPushNotification(
        recipientData.expoPushToken,
        'New Friend Request',
        `${requesterData.displayName || requesterData.username || 'Someone'} wants to be your friend!`,
        {
          type: 'friendRequest',
          requesterId
        }
      );
      
      console.log('Friend request notification sent successfully');
    } else {
      console.log(`Recipient ${recipientId} has no push token`);
    }
  } catch (error) {
    console.error('Error sending friend request notification:', error);
  }
}

// Send notification for challenge request
async function sendChallengeNotification(challengerId, recipientId, challengeId) {
  try {
    // Add validation to prevent empty document paths
    if (!challengerId || !recipientId) {
      console.error('Invalid parameters: challengerId or recipientId is empty', { 
        challengerId, 
        recipientId, 
        challengeId 
      });
      return;
    }

    // Get challenger's data
    const challengerDoc = await db.collection('users').doc(challengerId).get();
    
    if (!challengerDoc.exists) {
      console.error(`Challenger document doesn't exist: ${challengerId}`);
      return;
    }
    
    const challengerData = challengerDoc.data();
    
    // Get recipient's data including push token
    const recipientDoc = await db.collection('users').doc(recipientId).get();
    
    if (!recipientDoc.exists) {
      console.error(`Recipient document doesn't exist: ${recipientId}`);
      return;
    }
    
    const recipientData = recipientDoc.data();
    
    if (recipientData.expoPushToken) {
      console.log(`Sending challenge notification to ${recipientId} with token ${recipientData.expoPushToken}`);
      
      await sendPushNotification(
        recipientData.expoPushToken,
        'New Challenge!',
        `${challengerData.displayName || challengerData.username || 'Someone'} has challenged you to a game!`,
        {
          type: 'challenge',
          challengerId,
          challengeId
        }
      );
      
      console.log('Challenge notification sent successfully');
    } else {
      console.log(`Recipient ${recipientId} has no push token`);
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