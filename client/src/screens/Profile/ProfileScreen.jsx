import React, { useState, useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import ProfileView from '../../components/ProfileView';
import { database } from '../../services/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

export default function ProfileScreen() {
  const { currentUser } = useAuth();
  const route = useRoute();
  const displayedUser = route.params?.profileUser || currentUser;
  
  const [friendshipStatus, setFriendshipStatus] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!displayedUser || displayedUser.uid === currentUser.uid) {
      if (isMounted) setFriendshipStatus("self");
    } else {
      const checkFriendship = async () => {
        try {
          const friendshipQuery = query(
            collection(database, 'friendships'),
            where('status', 'in', ['confirmed', 'pending']),
            where('requesterId', 'in', [currentUser.uid, displayedUser.uid]),
            where('requesteeId', 'in', [currentUser.uid, displayedUser.uid])
          );
          const snapshot = await getDocs(friendshipQuery);
          if (!snapshot.empty) {
            const friendshipDoc = snapshot.docs[0].data();
            if (isMounted) setFriendshipStatus(friendshipDoc.status);
          } else {
            if (isMounted) setFriendshipStatus("none");
          }
        } catch (err) {
          console.error('Error checking friendship status:', err);
        }
      };
      checkFriendship();
    }
    return () => {
      isMounted = false;
    };
  }, [displayedUser, currentUser]);

  const handleAddFriend = async () => {
    try {
      await addDoc(collection(database, "friendships"), {
        status: "pending",
        requesterId: currentUser.uid,
        requesteeId: displayedUser.uid,
      });
      setFriendshipStatus("pending");
    } catch (err) {
      console.error("Error adding friend: ", err);
      alert("Error sending friend request.");
    }
  };

  return (
    <ProfileView
      user={displayedUser}
      friendshipStatus={friendshipStatus}
      onAddFriend={handleAddFriend}
      showChallenge={friendshipStatus === "confirmed"}
    />
  );
} 