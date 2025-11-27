import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { colors } from './src/theme';
import { StatusBar } from 'expo-status-bar';
import AuthScreen from './src/screens/AuthScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MealsScreen from './src/screens/MealsScreen';
import IngredientsToRecipeScreen from './src/screens/IngredientsToRecipeScreen';
import PhotoAnalysisScreen from './src/screens/PhotoAnalysisScreen';
import HealthScreen from './src/screens/HealthScreen';
import HomeScreen from './src/screens/HomeScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import PlanScreen from './src/screens/PlanScreen';
import RecipesScreen from './src/screens/RecipesScreen';
import { AuthService } from './src/services/authService';
import { UserProfile } from './src/types/types';

import CameraScreen from './src/screens/CameraScreen';
import ProfileEditScreen from './src/screens/ProfileEditScreen';
import TrackingScreen from './src/screens/TrackingScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';
import EditPlanScreen from './src/screens/PlanEditScreen';
import PlanDetailScreen from './src/screens/PlanDetailScreen';
import AIChat, { FloatingChatButton } from './src/components/AIChat';
import { useAppStore } from './src/store/useAppStore';

type Screen = 'home' | 'meals' | 'camera' | 'recipes' | 'health' | 'profile' | 'explore' | 'plan' | 'recipesList' | 'auth' | 'modernAuth' | 'cameraNative' | 'profileEdit' | 'tracking' | 'recipeDetailDemo' | 'editPlan' | 'ingredientsToRecipe' | 'planDetail';

function AppContent() {
  const { isDark } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);
  const [navigationParams, setNavigationParams] = useState<any>({});
  const { loadActivePlan } = useAppStore();

  useEffect(() => {
    // Auth state değişikliklerini dinle
    const { data: { subscription } } = AuthService.onAuthStateChanged(async (supabaseUser) => {
      if (supabaseUser) {
        try {
          let userProfile = await AuthService.getUserProfile(supabaseUser.id);
          
          // Eğer profil bulunamazsa, yeni profil oluştur
          if (!userProfile) {
            console.log('Kullanıcı profili bulunamadı, yeni profil oluşturuluyor...');
            
            // Doğrudan veritabanında profil oluştur
            const { supabase } = await import('./src/services/supabase');
            const { error: profileError } = await supabase
              .from('users')
              .insert([{
                id: supabaseUser.id,
                email: supabaseUser.email,
                name: supabaseUser.user_metadata?.name || 'Kullanıcı',
                plan_type: 'free',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }]);

            if (profileError) {
              console.error('Profil oluşturulamadı:', profileError);
            } else {
              // Tekrar profil getirmeyi dene
              userProfile = await AuthService.getUserProfile(supabaseUser.id);
            }
          }
          
          if (userProfile) {
            setUser(userProfile);
            setIsAuthenticated(true);
            
            // Kullanıcı giriş yaptıktan sonra aktif planı yükle
            await loadActivePlan(supabaseUser.id);
          } else {
            console.error('Profil oluşturulamadı');
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Kullanıcı profili yüklenemedi:', error);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });


    return () => subscription.unsubscribe();
  }, [loadActivePlan]);

  // Loading ekranı
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>EatWise</Text>
        <Text style={styles.loadingSubtext}>Yükleniyor...</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const navigate = (screen: Screen, params?: any) => {
    setCurrentScreen(screen);
    setNavigationParams(params || {});
  };

  const renderScreen = () => {
    const screenProps = { 
      navigation: { 
        navigate,
        goBack: () => setCurrentScreen('plan'),
        canGoBack: () => true
      }, 
      user 
    };
    
    console.log('Current user:', user); // Debug için
    
    switch (currentScreen) {
      case 'home':
        return <HomeScreen {...screenProps} />;
      case 'meals':
        return <MealsScreen {...screenProps} />;
      case 'camera':
        return <PhotoAnalysisScreen />;
      case 'recipes':
        return <IngredientsToRecipeScreen />;
      case 'health':
        return <HealthScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'explore':
        return <ExploreScreen {...screenProps} />;
      case 'plan':
        return <PlanScreen {...screenProps} />;
      case 'editPlan':
        return <EditPlanScreen 
          planId={navigationParams?.plan?.id}
          plan={navigationParams?.plan}
          recipeData={navigationParams?.recipeData}
          selectedRecipe={navigationParams?.selectedRecipe}
          selectedDay={navigationParams?.selectedDay}
          selectedMealType={navigationParams?.selectedMealType}
          onNavigateBack={() => setCurrentScreen('plan')}
          onNavigateToRecipe={(params) => {
            setNavigationParams(params);
            setCurrentScreen('ingredientsToRecipe');
          }}
        />;
      case 'planDetail':
        return <PlanDetailScreen {...screenProps} route={{ params: navigationParams }} />;
      case 'recipesList':
        return <RecipesScreen />;
      case 'auth':
        return <AuthScreen />;
      
      case 'cameraNative':
        return <CameraScreen />;
      case 'profileEdit':
        return <ProfileEditScreen user={user} onSave={() => setCurrentScreen('profile')} onCancel={() => setCurrentScreen('profile')} />;
      case 'tracking':
        return <TrackingScreen {...screenProps} />;
      case 'recipeDetailDemo': {
        const dummyRecipe = {
          title: 'Demo: Izgara Tavuk',
          description: 'Pratik ve sağlıklı bir akşam yemeği önerisi.',
          calories: 420,
          prepTime: 30,
          difficulty: 'Kolay',
          ingredients: ['250g tavuk göğsü', '1 yemek kaşığı zeytinyağı', 'Tuz, karabiber', 'Yanına salata'],
          instructions: ['Tavuğu zeytinyağı ve baharatlarla harmanla', 'Izgarada her iki tarafı 6-7 dakika pişir', 'Salata ile servis et'],
          protein: 35,
          carbs: 12,
          fat: 18,
        };
        return <RecipeDetailScreen route={{ params: { recipe: dummyRecipe } }} />;
      }
      case 'ingredientsToRecipe':
        return <IngredientsToRecipeScreen {...screenProps} route={{ params: navigationParams }} />;
      default:
        return <HomeScreen {...screenProps} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderScreen()}
      </View>
      
      {/* Bottom Tab Navigation */}
      <View style={[styles.tabBar, isDark && styles.tabBarDark]}>
        <TouchableOpacity 
          style={[styles.tab, currentScreen === 'home' && (isDark ? styles.activeTabDark : styles.activeTab)]} 
          onPress={() => setCurrentScreen('home')}
        >
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={[styles.tabLabel, isDark && styles.tabLabelDark]}>Ana Sayfa</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentScreen === 'meals' && (isDark ? styles.activeTabDark : styles.activeTab)]} 
          onPress={() => setCurrentScreen('meals')}
        >
          <Text style={styles.tabIcon}>🍽️</Text>
          <Text style={[styles.tabLabel, isDark && styles.tabLabelDark]}>Öğünler</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentScreen === 'camera' && (isDark ? styles.activeTabDark : styles.activeTab)]} 
          onPress={() => setCurrentScreen('camera')}
        >
          <Text style={styles.tabIcon}>📸</Text>
          <Text style={[styles.tabLabel, isDark && styles.tabLabelDark]}>Kamera</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentScreen === 'health' && (isDark ? styles.activeTabDark : styles.activeTab)]} 
          onPress={() => setCurrentScreen('health')}
        >
          <Text style={styles.tabIcon}>❤️</Text>
          <Text style={[styles.tabLabel, isDark && styles.tabLabelDark]}>Sağlık</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentScreen === 'profile' && (isDark ? styles.activeTabDark : styles.activeTab)]} 
          onPress={() => setCurrentScreen('profile')}
        >
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={[styles.tabLabel, isDark && styles.tabLabelDark]}>Profil</Text>
        </TouchableOpacity>
      </View>
      
      {/* Floating AI Chat Button */}
      {user && (
        <FloatingChatButton onPress={() => setShowAIChat(true)} />
      )}
      
      {/* AI Chat Modal */}
      <AIChat 
        visible={showAIChat} 
        onClose={() => setShowAIChat(false)} 
      />
      
      <StatusBar style="light" />
    </View>
  );
}


export default function App() {
  return (
    <NavigationContainer>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </NavigationContainer>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tabBarDark: {
    backgroundColor: colors.dark.surface,
    borderTopColor: colors.dark.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: '#f0f8f0',
    borderRadius: 8,
  },
  activeTabDark: {
    backgroundColor: colors.dark.primary + '20',
    borderRadius: 8,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  tabLabelDark: {
    color: colors.dark.text.secondary,
  },
  summaryCard: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  aiSuggestion: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  aiText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cameraPlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  cameraIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  cameraText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  cameraSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  captureButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  capturingButton: {
    backgroundColor: '#ccc',
  },
  captureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraInfo: {
    padding: 20,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  inputCard: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    minHeight: 100,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recipesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  recipeCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  recipeInfo: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  recipeCalories: {
    fontSize: 14,
    color: '#FF5722',
    marginRight: 20,
  },
  recipeTime: {
    fontSize: 14,
    color: '#2196F3',
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  ingredientsText: {
    fontSize: 14,
    color: '#666',
  },
  popularRecipes: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  popularGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  popularCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popularIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  popularTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  popularCalories: {
    fontSize: 12,
    color: '#666',
  },
  weeklyPlan: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dayCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  mealsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mealItem: {
    flex: 1,
    alignItems: 'center',
    marginRight: 10,
  },
  mealIcon: {
    fontSize: 16,
    marginBottom: 5,
  },
  mealText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  todayCard: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  todayItem: {
    alignItems: 'center',
  },
  todayIcon: {
    fontSize: 20,
    marginBottom: 5,
  },
  todayValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  todayLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  todayTarget: {
    fontSize: 10,
    color: '#999',
  },
  chartsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  chartCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 80,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 5,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
  },
  barValue: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  goalsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  goalCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalItem: {
    marginBottom: 15,
  },
  goalText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 4,
  },
  profileHeader: {
    backgroundColor: '#4CAF50',
    padding: 30,
    alignItems: 'center',
    paddingTop: 50,
  },
  profileIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 15,
  },
  planBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  planText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsCard: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  menuCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  menuArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  logoutButton: {
    backgroundColor: '#F44336',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  appInfo: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  appCopyright: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  loadingSubtext: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
  },
});
