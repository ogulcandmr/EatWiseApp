import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MealService, MealData, DailyTotal } from '../services/mealService';
import { AuthService } from '../services/authService';
import AddMealModal from '../components/AddMealModal';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme';

type FilterType = 'today' | 'week';

interface CombinedMeal extends MealData {
  isFromPlan?: boolean;
  planDay?: string;
  planMealType?: string;
  source: 'manual' | 'plan';
  // Plan öğünlerinden gelen ek alanlar - MealData'da olmayan alanlar
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  description?: string;
  ingredients?: string[];
  instructions?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  image_url?: string;
}

interface MealsScreenProps {
  navigation?: {
    navigate: (screen: any, params?: any) => void;
    goBack: () => void;
  };
  user?: any;
}

export default function MealsScreen({ navigation }: MealsScreenProps) {
  const { isDark } = useTheme();
  const [meals, setMeals] = useState<CombinedMeal[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotal>({
    date: '',
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    mealCount: 0
  });
  const [filter, setFilter] = useState<FilterType>('today');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<CombinedMeal | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const { 
    currentPlan, 
    activePlan, 
    planMealSync, 
    setPlanMealSync 
  } = useAppStore();

  // Trigger animations when data loads
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, fadeAnim, slideAnim, scaleAnim]);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error('User ID alınamadı:', error);
      }
    };
    getUserId();
  }, []);



  const getMealTypeName = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'breakfast': return 'Kahvaltı';
      case 'lunch': return 'Öğle Yemeği';
      case 'dinner': return 'Akşam Yemeği';
      case 'snack': return 'Atıştırmalık';
      default: return type;
    }
  };

  const convertPlanMealsToMealData = useCallback(() => {
    const planMeals: CombinedMeal[] = [];
    const plan = currentPlan || activePlan;
    
    console.log('=== convertPlanMealsToMealData DEBUG ===');
    console.log('currentPlan:', currentPlan);
    console.log('activePlan:', activePlan);
    console.log('plan:', plan);
    console.log('userId:', userId);
    console.log('filter:', filter);
    
    // userId yoksa veya plan yoksa plan öğünlerini döndürme
    if (!userId || !plan?.weekly_plan) {
      console.log('Early return - userId:', userId, 'plan?.weekly_plan:', plan?.weekly_plan);
      return planMeals;
    }
    
    // Plan'ın user_id'si mevcut userId ile eşleşmiyorsa plan öğünlerini döndürme
    if (plan.user_id && plan.user_id !== userId) {
      console.warn('Plan user_id mismatch:', plan.user_id, 'vs', userId);
      return planMeals;
    }

    const today = new Date();
    console.log('Today:', today.toDateString());
    
    // Türkçe gün isimleri ile gün indeksleri eşleştirmesi
    const dayMapping: { [key: string]: number } = {
      'pazartesi': 1,
      'sali': 2, 
      'carsamba': 3,
      'persembe': 4,
      'cuma': 5,
      'cumartesi': 6,
      'pazar': 0
    };
    
    // Bu haftanın başını hesapla (Pazartesi)
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay(); // 0 = Pazar, 1 = Pazartesi, ...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(today.getDate() + mondayOffset);
    console.log('Start of week:', startOfWeek.toDateString());
    
    Object.entries(plan.weekly_plan).forEach(([day, dayPlan]) => {
      console.log(`Processing day: ${day}`, dayPlan);
      if (!dayPlan) return;
      
      // Bu günün bu haftaki tarihini hesapla
      const dayIndex = dayMapping[day.toLowerCase()];
      if (dayIndex === undefined) {
        console.log(`Unknown day: ${day}`);
        return;
      }
      
      const mealDate = new Date(startOfWeek);
      
      if (dayIndex === 0) {
        // Pazar - haftanın sonunda
        mealDate.setDate(startOfWeek.getDate() + 6);
      } else {
        // Pazartesi-Cumartesi
        mealDate.setDate(startOfWeek.getDate() + (dayIndex - 1));
      }
      
      console.log(`Day ${day} (${dayIndex}) -> Date: ${mealDate.toDateString()}`);
      
      // Filter kontrolü
      if (filter === 'today') {
        // Sadece bugünkü plan öğünleri
        if (mealDate.toDateString() !== today.toDateString()) {
          console.log(`Skipping ${day} - not today (${mealDate.toDateString()} vs ${today.toDateString()})`);
          return;
        }
        console.log(`Including ${day} - matches today!`);
      } else if (filter === 'week') {
        // Bu hafta - tüm hafta boyunca
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        if (mealDate < startOfWeek || mealDate > endOfWeek) {
          console.log(`Skipping ${day} - not in this week`);
          return;
        }
      }

      Object.entries(dayPlan).forEach(([mealType, meals]) => {
        console.log(`Processing meal type: ${mealType}`, meals);
        if (Array.isArray(meals)) {
          meals.forEach((meal, index) => {
            console.log(`Processing meal ${index}:`, meal);
            if (meal && meal.name) {
              const mealTypeFormatted = getMealTypeName(mealType);
              
              // Benzersiz ve tutarlı ID oluştur
              const dateStr = mealDate.toISOString().split('T')[0];
              const uniqueId = `plan-${plan.id || 'temp'}-${dateStr}-${day}-${mealType}-${index}`;
              
              const planMeal = {
                id: uniqueId,
                name: meal.name,
                meal_type: mealTypeFormatted as 'breakfast' | 'lunch' | 'dinner' | 'snack',
                total_calories: meal.calories || 0,
                total_protein: meal.protein || 0,
                total_carbs: meal.carbs || 0,
                total_fat: meal.fat || 0,
                created_at: mealDate.toISOString(),
                user_id: userId,
                isFromPlan: true,
                planDay: day,
                planMealType: mealType,
                source: 'plan' as const,
                // Plan öğünlerinden gelen ek veriler
                calories: meal.calories || 0,
                protein: meal.protein || 0,
                carbs: meal.carbs || 0,
                fat: meal.fat || 0,
                fiber: meal.fiber || 0,
                sugar: meal.sugar || 0,
                sodium: meal.sodium || 0,
                description: meal.description,
                ingredients: meal.ingredients,
                instructions: meal.instructions,
                prep_time: meal.prep_time,
                cook_time: meal.cook_time,
                servings: meal.servings,
                image_url: meal.image_url
              };
              
              console.log('Adding plan meal:', planMeal);
              planMeals.push(planMeal);
            }
          });
        }
      });
    });
    
    console.log('Final planMeals count:', planMeals.length);
    console.log('=== END convertPlanMealsToMealData DEBUG ===');
    return planMeals;
  }, [currentPlan, activePlan, filter, userId]);

  const loadMeals = useCallback(async () => {
    console.log('=== loadMeals DEBUG ===');
    console.log('userId:', userId);
    console.log('filter:', filter);
    
    if (!userId) {
      console.log('No userId, returning early');
      return;
    }
    
    setLoading(true);
    try {
      // Manuel eklenen öğünleri yükle - sadece bugün/bu hafta için
      const fetchedMeals = await MealService.getMeals(userId);
      console.log('Fetched manual meals:', fetchedMeals.length);
      
      // Tarihe göre filtrele
      const today = new Date();
      const filteredMeals = fetchedMeals.filter(meal => {
        if (!meal.created_at) return false;
        
        const mealDate = new Date(meal.created_at);
        
        if (filter === 'today') {
          // Sadece bugünkü öğünler
          return mealDate.toDateString() === today.toDateString();
        } else {
          // Bu hafta - haftanın başından bugüne kadar
          const startOfWeek = new Date(today);
          const dayOfWeek = today.getDay(); // 0 = Pazar, 1 = Pazartesi, ...
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Pazartesi'yi hafta başı yap
          startOfWeek.setDate(today.getDate() + mondayOffset);
          startOfWeek.setHours(0, 0, 0, 0);
          
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          
          return mealDate >= startOfWeek && mealDate <= endOfWeek;
        }
      });
      
      console.log('Filtered manual meals:', filteredMeals.length);
      
      // Plan öğünlerini al
      const planMeals = convertPlanMealsToMealData();
      console.log('Plan meals from convertPlanMealsToMealData:', planMeals.length);
      
      // Manuel öğünlere source ekle
      const manualMealsWithSource = filteredMeals.map(meal => ({
        ...meal,
        source: 'manual' as const
      }));
      
      // Manuel öğünleri ve plan öğünlerini ayrı ayrı işle
      const allMeals: CombinedMeal[] = [];
      
      // Manuel öğünleri ekle
      manualMealsWithSource.forEach(meal => {
        if (meal.id && meal.name && meal.name.trim() !== '') {
          console.log('Adding manual meal:', meal.name);
          allMeals.push(meal);
        }
      });
      
      // Plan öğünlerini ekle - sadece geçerli user_id varsa ve boş değilse
      planMeals.forEach(meal => {
        if (meal.id && meal.name && meal.name.trim() !== '' && meal.user_id && meal.user_id === userId) {
          console.log('Adding plan meal:', meal.name);
          allMeals.push(meal);
        } else {
          console.log('Skipping plan meal:', meal.name, 'user_id:', meal.user_id, 'expected:', userId);
        }
      });
      
      console.log('Total combined meals:', allMeals.length);
      
      // Tarihe göre sırala (en yeni önce)
      const combinedMeals = allMeals.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
      
      console.log('Final sorted meals:', combinedMeals.length);
      setMeals(combinedMeals);

      // Günlük toplamları hesapla
      if (filter === 'today') {
        const todayMeals = combinedMeals.filter(meal => {
          if (!meal.created_at) return false;
          const mealDate = new Date(meal.created_at).toDateString();
          const todayStr = new Date().toDateString();
          return mealDate === todayStr;
        });
        console.log('Today meals for totals:', todayMeals.length);
        const totals = MealService.calculateDailyTotals(todayMeals);
        console.log('Daily totals:', totals);
        setDailyTotals(totals);
      }
    } catch (error: any) {
      console.error('Error in loadMeals:', error);
      Alert.alert('Hata', error.message || 'Öğünler yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    console.log('=== END loadMeals DEBUG ===');
  }, [userId, filter, convertPlanMealsToMealData]);

  useEffect(() => {
    if (userId) {
      loadMeals();
    }
  }, [userId, filter, loadMeals]);

  // Plan değişikliklerini dinle ve meals'ı güncelle
  useEffect(() => {
    if (planMealSync && (currentPlan || activePlan)) {
      console.log('Plan değişikliği algılandı, meals yeniden yükleniyor...');
      loadMeals();
      setPlanMealSync(false);
    }
  }, [planMealSync, currentPlan, activePlan, loadMeals, setPlanMealSync]);

  // Modal durumunu izle
  useEffect(() => {
    console.log('showDetailModal değişti:', showDetailModal);
    console.log('selectedMeal değişti:', selectedMeal);
  }, [showDetailModal, selectedMeal]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMeals();
  };

  const handleMealDetail = (meal: CombinedMeal) => {
    console.log('handleMealDetail çağrıldı:', meal);
    setSelectedMeal(meal);
    setShowDetailModal(true);
    console.log('Modal açılıyor, showDetailModal:', true);
  };

  const handleDeleteMeal = (mealId: string, mealName: string, isFromPlan: boolean) => {
    if (isFromPlan) {
      Alert.alert('Bilgi', 'Plan öğünleri buradan silinemez. Plan sayfasından düzenleyebilirsiniz.');
      return;
    }

    Alert.alert(
      'Öğün Sil',
      `"${mealName}" öğününü silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await MealService.deleteMeal(mealId);
              Alert.alert('Başarılı', 'Öğün silindi');
              loadMeals();
            } catch (error: any) {
              Alert.alert('Hata', error.message || 'Öğün silinemedi');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Bugün';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Dün';
    } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
      return 'Yarın';
    } else {
      const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
      const dayName = dayNames[date.getDay()];
      const dateStr = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
      return `${dayName}, ${dateStr}`;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  // Öğünleri tarihe göre grupla
  const groupedMeals = meals.reduce((groups, meal) => {
    const date = meal.created_at?.split('T')[0] || '';
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(meal);
    return groups;
  }, {} as Record<string, CombinedMeal[]>);

  // Tarihleri sırala
  const sortedDates = Object.keys(groupedMeals).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Modern Header */}
      <LinearGradient
        colors={isDark ? ['#1E3A8A', '#1E40AF', '#2563EB'] : ['#10B981', '#059669']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Öğünlerim</Text>
            <Text style={styles.subtitle}>
              {filter === 'today' ? 'Bugünkü öğünlerin' : 'Bu haftaki öğünlerin'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, isDark && styles.filterContainerDark]}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            isDark && styles.filterButtonDark,
            filter === 'today' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('today')}
        >
          <Text style={[
            styles.filterText,
            isDark && styles.filterTextDark,
            filter === 'today' && styles.filterTextActive
          ]}>
            Bugün
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            isDark && styles.filterButtonDark,
            filter === 'week' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('week')}
        >
          <Text style={[
            styles.filterText,
            isDark && styles.filterTextDark,
            filter === 'week' && styles.filterTextActive
          ]}>
            Bu Hafta
          </Text>
        </TouchableOpacity>
      </View>

      {/* Daily Totals Card - Only for Today - Compact Version */}
      {filter === 'today' && (
        <Animated.View 
          style={[
            styles.totalsCard, 
            isDark && styles.totalsCardDark,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <LinearGradient
            colors={isDark ? ['#1E3A8A', '#1E40AF'] : ['#10B981', '#059669']}
            style={styles.totalsCardGradient}
          >
            <View style={styles.totalsTitleContainer}>
              <MaterialIcons name="analytics" size={18} color="white" style={styles.totalsTitleIcon} />
              <Text style={styles.totalsTitleWhite}>Günlük Özet</Text>
            </View>
            
            <View style={styles.totalsGrid}>
              <View style={styles.totalItemModern}>
                <View style={[styles.totalIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <MaterialIcons name="local-fire-department" size={16} color="white" />
                </View>
                <Text style={styles.totalValueWhite}>{Math.round(dailyTotals.totalCalories)}</Text>
                <Text style={styles.totalLabelWhite}>Kalori</Text>
              </View>
              
              <View style={styles.totalItemModern}>
                <View style={[styles.totalIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <MaterialIcons name="fitness-center" size={16} color="white" />
                </View>
                <Text style={styles.totalValueWhite}>{Math.round(dailyTotals.totalProtein)}g</Text>
                <Text style={styles.totalLabelWhite}>Protein</Text>
              </View>
              
              <View style={styles.totalItemModern}>
                <View style={[styles.totalIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <MaterialIcons name="grain" size={16} color="white" />
                </View>
                <Text style={styles.totalValueWhite}>{Math.round(dailyTotals.totalCarbs)}g</Text>
                <Text style={styles.totalLabelWhite}>Karbonhidrat</Text>
              </View>
              
              <View style={styles.totalItemModern}>
                <View style={[styles.totalIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <MaterialIcons name="opacity" size={16} color="white" />
                </View>
                <Text style={styles.totalValueWhite}>{Math.round(dailyTotals.totalFat)}g</Text>
                <Text style={styles.totalLabelWhite}>Yağ</Text>
              </View>
            </View>
            
            <View style={styles.mealCountContainer}>
              <MaterialIcons name="restaurant" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.mealCountWhite}>
                {dailyTotals.mealCount} öğün
              </Text>
            </View>
           </LinearGradient>
         </Animated.View>
       )}

      {/* Meals List */}
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
              Öğünler yükleniyor...
            </Text>
          </View>
        ) : sortedDates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="restaurant" size={60} color="#ccc" />
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              Henüz öğün eklenmemiş
            </Text>
            <Text style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}>
              {filter === 'today' 
                ? 'Bugün için öğün eklemek için + butonuna dokunun'
                : 'Bu hafta için plan oluşturun veya öğün ekleyin'
              }
            </Text>
          </View>
        ) : (
          sortedDates.map(date => (
            <View key={date} style={styles.dateSection}>
              <Text style={[styles.dateHeader, isDark && styles.dateHeaderDark]}>
                {formatDate(date)}
              </Text>
              {groupedMeals[date].map((meal, index) => (
                <TouchableOpacity
                  key={`${meal.id}-${index}`}
                  style={[styles.mealCard, isDark && styles.mealCardDark, meal.source === 'plan' && styles.planMealCard]}
                  onPress={() => {
                    console.log('Karta tıklandı, meal:', meal);
                    handleMealDetail(meal);
                  }}
                  activeOpacity={0.7}
                >
                  {/* Plan Badge */}
                  {meal.source === 'plan' && (
                    <View style={styles.planBadgeContainer}>
                      <LinearGradient
                        colors={['#4CAF50', '#45A049']}
                        style={styles.planBadgeGradient}
                      >
                        <MaterialIcons name="event-note" size={12} color="white" />
                        <Text style={styles.planBadgeText}>Plan</Text>
                      </LinearGradient>
                    </View>
                  )}

                  <View style={styles.mealHeader}>
                    <View style={styles.mealTitleRow}>
                      <View style={[styles.mealEmojiContainer, meal.source === 'plan' && styles.planEmojiContainer]}>
                        <MaterialIcons 
                          name={meal.source === 'plan' ? 'event-note' : 'restaurant'} 
                          size={24} 
                          color={meal.source === 'plan' ? '#4CAF50' : '#FF6B35'} 
                        />
                      </View>
                      <View style={styles.mealInfo}>
                        <Text style={[styles.mealName, isDark && styles.mealNameDark]}>
                          {meal.name}
                        </Text>
                        <View style={styles.mealMetaRow}>
                          <Text style={[styles.mealType, isDark && styles.mealTypeDark]}>
                            {getMealTypeName(meal.meal_type)}
                          </Text>
                          <Text style={[styles.mealTime, isDark && styles.mealTimeDark]}>
                            {formatTime(meal.created_at!)}
                          </Text>
                        </View>
                        {meal.description && (
                          <Text style={[styles.mealDescription, isDark && styles.mealDescriptionDark]} numberOfLines={2}>
                            {meal.description}
                          </Text>
                        )}
                      </View>
                    </View>
                    {meal.source !== 'plan' && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteMeal(meal.id!, meal.name, meal.source === 'plan')}
                      >
                        <MaterialIcons name="delete" size={20} color="#FF5722" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Enhanced Macros Section */}
                  <View style={[styles.mealMacros, isDark && styles.mealMacrosDark]}>
                    <View style={styles.macroItem}>
                      <View style={[styles.macroIconContainer, { backgroundColor: '#FF5722' }]}>
                        <MaterialIcons name="local-fire-department" size={12} color="white" />
                      </View>
                      <Text style={[styles.macroValue, isDark && styles.macroValueDark]}>
                        {Math.round(meal.calories || meal.total_calories)}
                      </Text>
                      <Text style={[styles.macroLabel, isDark && styles.macroLabelDark]}>
                        Kalori
                      </Text>
                    </View>
                    <View style={styles.macroItem}>
                      <View style={[styles.macroIconContainer, { backgroundColor: '#4CAF50' }]}>
                        <MaterialIcons name="fitness-center" size={12} color="white" />
                      </View>
                      <Text style={[styles.macroValue, isDark && styles.macroValueDark]}>
                        {Math.round(meal.protein || meal.total_protein)}g
                      </Text>
                      <Text style={[styles.macroLabel, isDark && styles.macroLabelDark]}>
                        Protein
                      </Text>
                    </View>
                    <View style={styles.macroItem}>
                      <View style={[styles.macroIconContainer, { backgroundColor: '#2196F3' }]}>
                        <MaterialIcons name="grain" size={12} color="white" />
                      </View>
                      <Text style={[styles.macroValue, isDark && styles.macroValueDark]}>
                        {Math.round(meal.carbs || meal.total_carbs)}g
                      </Text>
                      <Text style={[styles.macroLabel, isDark && styles.macroLabelDark]}>
                        Karbonhidrat
                      </Text>
                    </View>
                    <View style={styles.macroItem}>
                      <View style={[styles.macroIconContainer, { backgroundColor: '#FF9800' }]}>
                        <MaterialIcons name="opacity" size={12} color="white" />
                      </View>
                      <Text style={[styles.macroValue, isDark && styles.macroValueDark]}>
                        {Math.round(meal.fat || meal.total_fat)}g
                      </Text>
                      <Text style={[styles.macroLabel, isDark && styles.macroLabelDark]}>
                        Yağ
                      </Text>
                    </View>
                  </View>

                  {/* Additional Info Row */}
                  <View style={styles.mealFooter}>
                    {meal.servings && (
                      <View style={styles.servingInfo}>
                        <MaterialIcons name="people" size={14} color="#666" />
                        <Text style={[styles.servingText, isDark && styles.servingTextDark]}>
                          {meal.servings} kişilik
                        </Text>
                      </View>
                    )}
                    {(meal.prep_time || meal.cook_time) && (
                      <View style={styles.timeInfo}>
                        <MaterialIcons name="schedule" size={14} color="#666" />
                        <Text style={[styles.timeText, isDark && styles.timeTextDark]}>
                          {(meal.prep_time || 0) + (meal.cook_time || 0)} dk
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <MaterialIcons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Add Meal Modal */}
      {userId && (
        <AddMealModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onMealAdded={() => {
            setShowAddModal(false);
            loadMeals();
          }}
          userId={userId}
        />
      )}

      {/* Meal Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          console.log('Modal kapatılıyor');
          setShowDetailModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
            {(() => { console.log('Modal içeriği render ediliyor, selectedMeal:', selectedMeal); return null; })()}
            <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
              {selectedMeal && (
                <>
                  {(() => { console.log('selectedMeal mevcut, modal içeriği gösteriliyor'); return null; })()}
                  <LinearGradient
                  colors={['#4CAF50', '#45A049']}
                  style={styles.modalHeader}
                >
                  <View style={styles.modalTitleContainer}>
                    <MaterialIcons 
                      name={selectedMeal.source === 'plan' ? 'event-note' : 'restaurant'} 
                      size={24} 
                      color="white" 
                      style={styles.modalTitleIcon}
                    />
                    <Text style={styles.modalTitle}>
                      {selectedMeal.name || 'İsim Bulunamadı'}
                    </Text>
                  </View>
                </LinearGradient>

                <ScrollView style={styles.modalBody}>
                  {/* Basic Info Section - Always Show */}
                  <LinearGradient
                    colors={['#FF5722', '#E64A19']}
                    style={styles.detailCard}
                  >
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: 'white' }]}>Öğün Türü:</Text>
                      <Text style={[styles.detailValue, { color: 'white' }]}>
                        {selectedMeal.meal_type || 'Bilinmiyor'}
                        {selectedMeal.isFromPlan && ' (Plan)'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: 'white' }]}>Tarih:</Text>
                      <Text style={[styles.detailValue, { color: 'white' }]}>
                        {selectedMeal.created_at ? formatDate(selectedMeal.created_at.split('T')[0]) : 'Bilinmiyor'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: 'white' }]}>Saat:</Text>
                      <Text style={[styles.detailValue, { color: 'white' }]}>
                        {selectedMeal.created_at ? formatTime(selectedMeal.created_at) : 'Bilinmiyor'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: 'white' }]}>Porsiyon:</Text>
                      <Text style={[styles.detailValue, { color: 'white' }]}>
                        {selectedMeal.servings || 1} kişilik
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: 'white' }]}>Kaynak:</Text>
                      <Text style={[styles.detailValue, { color: 'white' }]}>
                        {selectedMeal.source === 'plan' ? 'Plan Öğünü' : 'Manuel Eklenen'}
                      </Text>
                    </View>
                  </LinearGradient>

                  {/* Description Section */}
                  <LinearGradient
                    colors={['#673AB7', '#512DA8']}
                    style={styles.detailCard}
                  >
                    <View style={styles.sectionHeader}>
                      <MaterialIcons name="description" size={20} color="white" />
                      <Text style={styles.sectionTitle}>Açıklama</Text>
                    </View>
                    <Text style={styles.descriptionText}>
                      {typeof selectedMeal.description === 'string' 
                        ? selectedMeal.description 
                        : 'Açıklama bulunmuyor.'}
                    </Text>
                  </LinearGradient>

                  {/* Ingredients Section */}
                  <LinearGradient
                    colors={['#009688', '#00796B']}
                    style={styles.detailCard}
                  >
                    <View style={styles.sectionHeader}>
                      <MaterialIcons name="list" size={20} color="white" />
                      <Text style={styles.sectionTitle}>Malzemeler</Text>
                    </View>
                    {selectedMeal.ingredients && selectedMeal.ingredients.length > 0 ? (
                      selectedMeal.ingredients.map((ingredient, index) => (
                        <View key={index} style={styles.ingredientRow}>
                          <MaterialIcons name="fiber-manual-record" size={8} color="white" />
                          <Text style={styles.ingredientText}>{ingredient}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.descriptionText}>Malzeme listesi bulunmuyor.</Text>
                    )}
                  </LinearGradient>

                  {/* Instructions Section */}
                  <LinearGradient
                    colors={['#FF5722', '#D84315']}
                    style={styles.detailCard}
                  >
                    <View style={styles.sectionHeader}>
                      <MaterialIcons name="menu-book" size={20} color="white" />
                      <Text style={styles.sectionTitle}>Tarif</Text>
                    </View>
                    {Array.isArray(selectedMeal.instructions) ? (
                      selectedMeal.instructions.map((instruction, index) => (
                        <View key={index} style={styles.ingredientRow}>
                          <MaterialIcons name="check-circle" size={16} color="white" />
                          <Text style={styles.ingredientText}>{`${index + 1}. ${instruction}`}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.instructionsText}>
                        {typeof selectedMeal.instructions === 'string' 
                          ? selectedMeal.instructions 
                          : 'Tarif bulunmuyor.'}
                      </Text>
                    )}
                  </LinearGradient>

                  {/* Preparation Time Section */}
                  <LinearGradient
                    colors={['#795548', '#5D4037']}
                    style={styles.detailCard}
                  >
                    <View style={styles.sectionHeader}>
                      <MaterialIcons name="schedule" size={20} color="white" />
                      <Text style={styles.sectionTitle}>Hazırlık Süresi</Text>
                    </View>
                    <View style={styles.timeRow}>
                      <View style={styles.timeItem}>
                        <MaterialIcons name="kitchen" size={16} color="white" />
                        <Text style={styles.timeText}>Hazırlık: {selectedMeal.prep_time || 0} dk</Text>
                      </View>
                      <View style={styles.timeItem}>
                        <MaterialIcons name="whatshot" size={16} color="white" />
                        <Text style={styles.timeText}>Pişirme: {selectedMeal.cook_time || 0} dk</Text>
                      </View>
                    </View>
                  </LinearGradient>

                  {/* Nutrition Section */}
                  <LinearGradient
                    colors={['#2196F3', '#1976D2']}
                    style={styles.detailCard}
                  >
                    <View style={styles.sectionHeader}>
                      <MaterialIcons name="analytics" size={20} color="white" />
                      <Text style={styles.sectionTitle}>Besin Değerleri</Text>
                    </View>
                    <View style={styles.nutritionGrid}>
                      <View style={styles.nutritionRow}>
                        <MaterialIcons name="local-fire-department" size={20} color="white" />
                        <Text style={styles.nutritionRowLabel}>Kalori:</Text>
                        <Text style={styles.nutritionRowValue}>
                          {Math.round(Number((selectedMeal.calories || selectedMeal.total_calories) || 0))} kcal
                        </Text>
                      </View>
                      <View style={styles.nutritionRow}>
                        <MaterialIcons name="fitness-center" size={20} color="white" />
                        <Text style={styles.nutritionRowLabel}>Protein:</Text>
                        <Text style={styles.nutritionRowValue}>
                          {Math.round(Number((selectedMeal.protein || selectedMeal.total_protein) || 0))} g
                        </Text>
                      </View>
                      <View style={styles.nutritionRow}>
                        <MaterialIcons name="grain" size={20} color="white" />
                        <Text style={styles.nutritionRowLabel}>Karbonhidrat:</Text>
                        <Text style={styles.nutritionRowValue}>
                          {Math.round(Number((selectedMeal.carbs || selectedMeal.total_carbs) || 0))} g
                        </Text>
                      </View>
                      <View style={styles.nutritionRow}>
                        <MaterialIcons name="opacity" size={20} color="white" />
                        <Text style={styles.nutritionRowLabel}>Yağ:</Text>
                        <Text style={styles.nutritionRowValue}>
                          {Math.round(Number((selectedMeal.fat || selectedMeal.total_fat) || 0))} g
                        </Text>
                      </View>
                      {selectedMeal.fiber && (
                        <View style={styles.nutritionRow}>
                          <MaterialIcons name="eco" size={20} color="white" />
                          <Text style={styles.nutritionRowLabel}>Lif:</Text>
                          <Text style={styles.nutritionRowValue}>
                            {Math.round(Number(selectedMeal.fiber || 0))} g
                          </Text>
                        </View>
                      )}
                      {selectedMeal.sugar && (
                        <View style={styles.nutritionRow}>
                          <MaterialIcons name="cake" size={20} color="white" />
                          <Text style={styles.nutritionRowLabel}>Şeker:</Text>
                          <Text style={styles.nutritionRowValue}>
                            {Math.round(Number(selectedMeal.sugar || 0))} g
                          </Text>
                        </View>
                      )}
                      {selectedMeal.sodium && (
                        <View style={styles.nutritionRow}>
                          <MaterialIcons name="grain" size={20} color="white" />
                          <Text style={styles.nutritionRowLabel}>Sodyum:</Text>
                          <Text style={styles.nutritionRowValue}>
                            {Math.round(Number(selectedMeal.sodium || 0))} mg
                          </Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </ScrollView>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowDetailModal(false)}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#45A049']}
                    style={styles.closeButtonGradient}
                  >
                    <Text style={styles.closeButtonText}>Kapat</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  containerDark: {
    backgroundColor: colors.dark.background,
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTextContainer: {
    flex: 1,
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
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    gap: 10,
  },
  filterContainerDark: {
    backgroundColor: colors.dark.surface,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  filterButtonDark: {
    backgroundColor: colors.dark.backgroundElevated,
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTextDark: {
    color: colors.dark.text.secondary,
  },
  filterTextActive: {
    color: 'white',
  },
  totalsCard: {
    margin: 15,
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalsCardDark: {
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  totalsCardGradient: {
    borderRadius: 12,
    padding: 15,
  },
  totalsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  totalsTitleIcon: {
    marginRight: 6,
  },
  totalsTitleWhite: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  totalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalItemModern: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  totalValueWhite: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  totalLabelWhite: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  mealCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 2,
  },
  mealCountWhite: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  mealCountDark: {
    color: colors.dark.text.tertiary,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  loadingTextDark: {
    color: colors.dark.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyTextDark: {
    color: colors.dark.text.secondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  emptySubtextDark: {
    color: colors.dark.text.tertiary,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
  },
  dateHeaderDark: {
    color: colors.dark.text.primary,
    backgroundColor: colors.dark.backgroundElevated,
  },
  mealCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: 10,
    padding: 15,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  mealCardDark: {
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  planMealCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  planBadgeContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  planBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  planBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  mealEmojiContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planEmojiContainer: {
    backgroundColor: '#E8F5E8',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  mealNameDark: {
    color: colors.dark.text.primary,
  },
  mealMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  mealType: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  mealTypeDark: {
    color: colors.dark.text.secondary,
  },
  mealTime: {
    fontSize: 12,
    color: '#999',
  },
  mealTimeDark: {
    color: colors.dark.text.tertiary,
  },
  mealDescription: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    lineHeight: 16,
  },
  mealDescriptionDark: {
    color: colors.dark.text.tertiary,
  },
  planBadge: {
    fontSize: 12,
    color: '#4CAF50',
  },
  deleteButton: {
    padding: 5,
  },
  mealMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  mealMacrosDark: {
    borderTopColor: colors.dark.border,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },

  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  macroValueDark: {
    color: colors.dark.text.primary,
  },
  macroLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  macroLabelDark: {
    color: colors.dark.text.secondary,
  },
  mealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  servingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  servingText: {
    fontSize: 12,
    color: '#666',
  },
  servingTextDark: {
    color: colors.dark.text.secondary,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeTextDark: {
    color: colors.dark.text.secondary,
  },
  macroDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalContentDark: {
    backgroundColor: colors.dark.surface,
  },
  modalHeader: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginBottom: 0,
    alignItems: 'center',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleIcon: {
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  detailCard: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  nutritionGrid: {
    gap: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  nutritionRowLabel: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    flex: 1,
  },
  nutritionRowValue: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    minWidth: 80,
    textAlign: 'right',
  },
  nutritionItem: {
    width: '48%',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  nutritionIcon: {
    marginBottom: 5,
  },
  nutritionLabel: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    marginBottom: 5,
  },
  nutritionValue: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  descriptionText: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  ingredientText: {
    fontSize: 14,
    color: 'white',
    flex: 1,
  },
  instructionsText: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
  },
  timeRow: {
    gap: 12,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  closeButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  closeButtonGradient: {
    padding: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
