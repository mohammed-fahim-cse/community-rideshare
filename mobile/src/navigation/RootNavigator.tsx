import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import WelcomeScreen from '../screens/WelcomeScreen';
import JoinCommunityScreen from '../screens/JoinCommunityScreen';
import LoginScreen from '../screens/LoginScreen';
import VerifyOtpScreen from '../screens/VerifyOtpScreen';
import HomeScreen from '../screens/HomeScreen';
import CreateRidePostScreen from '../screens/CreateRidePostScreen';

export type AuthStackParamList = {
  Welcome: undefined;
  JoinCommunity: undefined;
  Login: undefined;
  VerifyOtp: { phone: string };
};

export type AppStackParamList = {
  Home: undefined;
  CreateRidePost: undefined;
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
