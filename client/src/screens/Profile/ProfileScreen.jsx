import React, { useState, useEffect } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import ProfileView from '../../components/ProfileView';
import { database } from '../../services/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

export default function ProfileScreen() {
  const { currentUser } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();
  const displayedUser = route.params?.profileUser || currentUser;
  
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [friendCount, setFriendCount] = useState(0);

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

  // New effect to fetch friend count
  useEffect(() => {
    let isMounted = true;
    
    const fetchFriendCount = async () => {
      if (!displayedUser) return;
      
      try {
        const friendshipsRef = collection(database, "friendships");
        
        // Query friendships where the displayed user is the requester
        const q1 = query(
          friendshipsRef,
          where("status", "==", "confirmed"),
          where("requesterId", "==", displayedUser.uid)
        );
        
        // Query friendships where the displayed user is the requestee
        const q2 = query(
          friendshipsRef,
          where("status", "==", "confirmed"),
          where("requesteeId", "==", displayedUser.uid)
        );
        
        const [snapshot1, snapshot2] = await Promise.all([
          getDocs(q1),
          getDocs(q2)
        ]);
        
        if (isMounted) {
          setFriendCount(snapshot1.size + snapshot2.size);
        }
      } catch (err) {
        console.error('Error fetching friend count:', err);
      }
    };
    
    fetchFriendCount();
    
    return () => {
      isMounted = false;
    };
  }, [displayedUser]);

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

  // New handler for when the friend count is pressed
  const handleFriendsPress = () => {
    navigation.navigate('UserFriendsList', { user: displayedUser });
  };

  return (
    <ProfileView
      user={displayedUser}
      friendshipStatus={friendshipStatus}
      onAddFriend={handleAddFriend}
      showChallenge={friendshipStatus === "confirmed"}
      friendCount={friendCount}
      onFriendsPress={handleFriendsPress}
    />
  );
} 