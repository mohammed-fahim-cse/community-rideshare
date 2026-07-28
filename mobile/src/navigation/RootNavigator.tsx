import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import type { RidePost } from '../api/types';
import WelcomeScreen from '../screens/WelcomeScreen';
import JoinCommunityScreen from '../screens/JoinCommunityScreen';
import LoginScreen from '../screens/LoginScreen';
import VerifyOtpScreen from '../screens/VerifyOtpScreen';
import HomeScreen from '../screens/HomeScreen';
import CreateRidePostScreen from '../screens/CreateRidePostScreen';
import RideDetailScreen from '../screens/RideDetailScreen';
import ActiveRideScreen from '../screens/ActiveRideScreen';
import ChatScreen from '../screens/ChatScreen';
import RatingScreen from '../screens/RatingScreen';
import RideHistoryScreen from '../screens/RideHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PublicProfileScreen from '../screens/PublicProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MenuScreen from '../screens/MenuScreen';

export type AuthStackParamList = {
  Welcome: undefined;
  JoinCommunity: undefined;
  Login: undefined;
  VerifyOtp: { phone: string };
};

export type AppStackParamList = {
  Home: undefined;
  CreateRidePost: undefined;
  RideDetail: { rideId: string };
  ActiveRide: { ride: RidePost };
  Chat: { ride: RidePost };
  Rating: { ride: RidePost };
  RideHistory: undefined;
  Profile: undefined;
  PublicProfile: { userId: string };
  Settings: undefined;
  Menu: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

export function RootNavigator() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {status === 'signedIn' ? (
        <AppStack.Navigator>
          <AppStack.Screen name="Home" component={HomeScreen} options={{ title: 'Community RideShare' }} />
          <AppStack.Screen
            name="CreateRidePost"
            component={CreateRidePostScreen}
            options={{ title: 'Post a ride', presentation: 'modal' }}
          />
          <AppStack.Screen name="RideDetail" component={RideDetailScreen} options={{ title: 'Ride details' }} />
          <AppStack.Screen name="ActiveRide" component={ActiveRideScreen} />
          <AppStack.Screen name="Chat" component={ChatScreen} />
          <AppStack.Screen name="Rating" component={RatingScreen} options={{ title: 'Rate your ride' }} />
          <AppStack.Screen name="RideHistory" component={RideHistoryScreen} options={{ title: 'Ride history' }} />
          <AppStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
          <AppStack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ title: 'Member' }} />
          <AppStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
          <AppStack.Screen name="Menu" component={MenuScreen} options={{ title: 'Menu' }} />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
          <AuthStack.Screen name="JoinCommunity" component={JoinCommunityScreen} />
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
