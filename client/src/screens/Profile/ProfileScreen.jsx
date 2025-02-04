import React from 'react';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import ProfileView from '../../components/ProfileView';

export default function ProfileScreen() {
  const { currentUser } = useAuth();
  const route = useRoute();
  // Use the passed-in friend data (if available) or the current user
  const displayedUser = route.params?.profileUser || currentUser;

  return <ProfileView user={displayedUser} />;
} 