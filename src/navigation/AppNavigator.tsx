import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

import { RootStackParamList, MainTabParamList } from '../types/types';
import { useAuth } from '../hooks/useAuth';

// Ekranlar
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import RecipesScreen from '../screens/RecipesScreen';
import PlanScreen from '../screens/PlanScreen';
import TrackingScreen from '../screens/TrackingScreen';
import AuthScreen from '../screens/AuthScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PlanEditScreen from '../screens/PlanEditScreen';
import IngredientsToRecipeScreen from '../screens/IngredientsToRecipeScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Camera') {
            iconName = 'camera-alt';
          } else if (route.name === 'Recipes') {
            iconName = 'restaurant-menu';
          } else if (route.name === 'Plan') {
            iconName = 'event-note';
          } else if (route.name === 'Tracking') {
            iconName = 'analytics';
          } else {
            iconName = 'help';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Ana Sayfa' }}
      />
      <Tab.Screen 
        name="Camera" 
        component={CameraScreen}
        options={{ tabBarLabel: 'Kamera' }}
      />
      <Tab.Screen 
        name="Recipes" 
        component={RecipesScreen}
        options={{ tabBarLabel: 'Tarifler' }}
      />
      <Tab.Screen 
        name="Plan" 
        component={PlanScreen}
        options={{ tabBarLabel: 'Plan' }}
      />
      <Tab.Screen 
        name="Tracking" 
        component={TrackingScreen}
        options={{ tabBarLabel: 'Takip' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen 
              name="Main" 
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="RecipeDetail" 
              component={RecipeDetailScreen}
              options={{ 
                title: 'Tarif Detayı',
                headerStyle: { backgroundColor: '#4CAF50' },
                headerTintColor: '#fff'
              }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ 
                title: 'Profil',
                headerStyle: { backgroundColor: '#4CAF50' },
                headerTintColor: '#fff'
              }}
            />
            <Stack.Screen
              name="EditPlan"
              component={PlanEditScreen}
              options={{
                title: 'Planı Düzenle',
                headerStyle: { backgroundColor: '#4CAF50' },
                headerTintColor: '#fff'
              }}
            />
            <Stack.Screen
              name="IngredientsToRecipe"
              component={IngredientsToRecipeScreen}
              options={{
                title: 'Tarif Oluştur',
                headerStyle: { backgroundColor: '#4CAF50' },
                headerTintColor: '#fff'
              }}
            />
          </>
        ) : (
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
