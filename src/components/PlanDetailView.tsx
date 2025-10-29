import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DietPlan, MealPlan, DayPlan } from '../services/planService';
import { MealCompletionService } from '../services/mealCompletionService';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

interface PlanDetailViewProps {
  plan: DietPlan;
  onMealComplete: (mealId: string, completed: boolean) => void;
}

export const PlanDetailView: React.FC<PlanDetailViewProps> = ({
  plan,
  onMealComplete,
}) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  
  // Bugünün gününü tespit et ve selectedDay'i buna göre ayarla
  const getTodayIndex = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0: Pazar, 1: Pazartesi, ..., 6: Cumartesi
    // dayKeys array'i: ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi', 'pazar']
    // JavaScript getDay(): 0=Pazar, 1=Pazartesi, 2=Salı, 3=Çarşamba, 4=Perşembe, 5=Cuma, 6=Cumartesi
    // dayKeys indeksi: 0=Pazartesi, 1=Salı, 2=Çarşamba, 3=Perşembe, 4=Cuma, 5=Cumartesi, 6=Pazar
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Pazar -> 6, Pazartesi -> 0, ..., Cumartesi -> 5
  };
  
  const [selectedDay, setSelectedDay] = useState(getTodayIndex());
  const [completedMeals, setCompletedMeals] = useState<Set<string>>(new Set());

  // Güvenlik kontrolü: plan prop'unun varlığını kontrol et
  if (!plan || !plan.weekly_plan) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={isDark ? '#666' : '#ccc'} />
          <Text style={[styles.emptyText, { color: isDark ? '#ccc' : '#666' }]}>
            Plan verisi bulunamadı
          </Text>
        </View>
      </View>
    );
  }



  // Tamamlanan öğünleri yükle
  useEffect(() => {
    loadCompletedMeals();
  }, [selectedDay, plan.id, user?.id]);

  const loadCompletedMeals = async () => {
    if (!user?.id || !plan.id) {
      console.log('=== MEAL COMPLETION DEBUG ===');
      console.log('User ID:', user?.id);
      console.log('Plan ID:', plan.id);
      console.log('Plan user_id:', plan.user_id);
      console.log('User object:', user);
      console.log('Plan object keys:', Object.keys(plan));
      console.log('=== END DEBUG ===');
      return;
    }

    console.log('=== LOADING COMPLETED MEALS ===');
    console.log('Current user ID:', user.id);
    console.log('Plan ID:', plan.id);
    console.log('Plan user_id:', plan.user_id);
    console.log('Selected day:', selectedDay);
    console.log('Day key:', dayKeys[selectedDay]);
    
    const dayOfWeek = dayKeys[selectedDay];
    const completions = await MealCompletionService.getDayCompletions(
      user.id,
      plan.id,
      dayOfWeek
    );

    console.log('Meal completions found:', completions.length);
    console.log('Completions:', completions);

    const completedSet = new Set<string>();
    completions.forEach(completion => {
      const mealKey = `${completion.meal_type}-${completion.meal_id}`;
      completedSet.add(mealKey);
    });

    setCompletedMeals(completedSet);
  };

  const daysOfWeek = [
    'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 
    'Cuma', 'Cumartesi', 'Pazar'
  ];

  const mealTypes = [
    { key: 'breakfast' as keyof DayPlan, label: 'Kahvaltı', icon: 'sunny-outline', color: '#FFD93D' },
    { key: 'lunch' as keyof DayPlan, label: 'Öğle Yemeği', icon: 'restaurant-outline', color: '#4ECDC4' },
    { key: 'dinner' as keyof DayPlan, label: 'Akşam Yemeği', icon: 'moon-outline', color: '#667eea' },
    { key: 'snacks' as keyof DayPlan, label: 'Atıştırmalık', icon: 'cafe-outline', color: '#FF6B6B' },
  ];

  const dayKeys = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi', 'pazar'];

  const getCurrentDayPlan = (): DayPlan | null => {
    console.log('=== getCurrentDayPlan DEBUG ===');
    console.log('selectedDay:', selectedDay);
    console.log('dayKeys:', dayKeys);
    console.log('dayKeys[selectedDay]:', dayKeys[selectedDay]);
    console.log('plan.weekly_plan keys:', plan?.weekly_plan ? Object.keys(plan.weekly_plan) : 'no weekly_plan');
    
    // Güvenlik kontrolleri
    if (!plan || !plan.weekly_plan) {
      console.log('No plan or weekly_plan');
      return null;
    }
    if (selectedDay < 0 || selectedDay >= dayKeys.length) {
      console.log('Invalid selectedDay index');
      return null;
    }
    
    const dayKey = dayKeys[selectedDay];
    if (!dayKey) {
      console.log('No dayKey found');
      return null;
    }
    
    const dayPlan = plan.weekly_plan[dayKey];
    console.log('dayPlan for', dayKey, ':', dayPlan);
    console.log('=== END getCurrentDayPlan DEBUG ===');
    return dayPlan || null;
  };

  const getMealsByType = (mealType: keyof DayPlan): MealPlan[] => {
    const currentDayPlan = getCurrentDayPlan();
    if (!currentDayPlan) return [];
    const meals = currentDayPlan[mealType];
    // Güvenlik kontrolü: meals undefined veya null ise boş array döndür
    if (!meals || !Array.isArray(meals)) return [];
    return meals;
  };

  const isMealCompleted = (mealId: string, mealType: string) => {
    // Güvenlik kontrolü
    if (!mealId || !mealType || !completedMeals) return false;
    const mealKey = `${mealType}-${mealId}`;
    return completedMeals.has(mealKey);
  };

  const handleMealToggle = async (meal: MealPlan, mealType: string) => {
    if (!user?.id || !plan.id || !meal || !meal.id || !mealType) return;

    const mealKey = `${mealType}-${meal.id}`;
    const isCompleted = completedMeals.has(mealKey);
    const newCompletedState = !isCompleted;

    // Veritabanını güncelle
    const dayOfWeek = dayKeys[selectedDay];
    const result = await MealCompletionService.toggleMealCompletion(
      user.id,
      plan.id,
      dayOfWeek,
      mealType,
      meal.id
    );

    if (result) {
      // Local state'i güncelle
      const newCompletedMeals = new Set(completedMeals);
      const isNowCompleted = result.completed_at !== null;
      
      if (isNowCompleted) {
        newCompletedMeals.add(mealKey);
      } else {
        newCompletedMeals.delete(mealKey);
      }
      setCompletedMeals(newCompletedMeals);

      // Parent component'i bilgilendir
      onMealComplete(meal.id, isNowCompleted);
      
      if (isNowCompleted) {
        // Tamamlandı animasyonu için feedback
        Alert.alert(
          '✅ Tamamlandı!',
          `${meal.name} başarıyla tamamlandı.`,
          [{ text: 'Tamam', style: 'default' }],
          { cancelable: true }
        );
      }
    }
  };

  const getCompletionStats = () => {
    const currentDayPlan = getCurrentDayPlan();
    if (!currentDayPlan) return { total: 0, completed: 0 };
    
    const mealTypesWithMeals = [
      { type: 'breakfast', meals: currentDayPlan.breakfast || [] },
      { type: 'lunch', meals: currentDayPlan.lunch || [] },
      { type: 'dinner', meals: currentDayPlan.dinner || [] },
      { type: 'snacks', meals: currentDayPlan.snacks || [] }
    ];
    
    let totalMeals = 0;
    let completedCount = 0;
    
    mealTypesWithMeals.forEach(({ type, meals }) => {
      // Güvenlik kontrolü: meals array'inin varlığını kontrol et
      if (!Array.isArray(meals)) return;
      
      totalMeals += meals.length;
      completedCount += meals.filter(meal => 
        meal && meal.id && isMealCompleted(meal.id, type)
      ).length;
    });
    
    return { total: totalMeals, completed: completedCount };
  };

  const stats = getCompletionStats();
  const completionPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']}
        style={styles.header}
      >
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
          {plan.name} - Detaylı Görünüm
        </Text>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: isDark ? '#B0B0B0' : '#7F8C8D' }]}>
              Günlük İlerleme: {stats.completed}/{stats.total}
            </Text>
            <Text style={[styles.progressPercentage, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
              %{Math.round(completionPercentage)}
            </Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground} />
            <LinearGradient
              colors={['#2ECC71', '#27AE60']}
              style={[styles.progressBarFill, { width: `${completionPercentage}%` }]}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Day Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.daySelector}
        contentContainerStyle={styles.daySelectorContent}
      >
        {daysOfWeek.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayButton,
              selectedDay === index && styles.dayButtonActive,
              isDark && styles.dayButtonDark,
              selectedDay === index && isDark && styles.dayButtonActiveDark,
            ]}
            onPress={() => setSelectedDay(index)}
          >
            <Text style={[
              styles.dayButtonText,
              selectedDay === index && styles.dayButtonTextActive,
              isDark && styles.dayButtonTextDark,
              selectedDay === index && isDark && styles.dayButtonTextActiveDark,
            ]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Meals List */}
      <ScrollView style={styles.mealsContainer} showsVerticalScrollIndicator={false}>
        {mealTypes.map((mealType) => {
          const meals = getMealsByType(mealType.key);
          
          if (meals.length === 0) return null;

          return (
            <View key={mealType.key} style={styles.mealTypeSection}>
              {/* Meal Type Header */}
              <View style={styles.mealTypeHeader}>
                <LinearGradient
                  colors={[mealType.color, `${mealType.color}CC`]}
                  style={styles.mealTypeIcon}
                >
                  <Ionicons name={mealType.icon as any} size={20} color="white" />
                </LinearGradient>
                <Text style={[styles.mealTypeTitle, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                  {mealType.label}
                </Text>
                <Text style={[styles.mealCount, { color: isDark ? '#B0B0B0' : '#7F8C8D' }]}>
                  {meals && Array.isArray(meals) ? 
                    `${meals.filter(meal => meal && meal.id && isMealCompleted(meal.id, mealType.key)).length}/${meals.length}` : 
                    '0/0'
                  }
                </Text>
              </View>

              {/* Meals */}
              {meals.map((meal) => {
                // Güvenlik kontrolü: meal objesi ve gerekli alanları kontrol et
                if (!meal || !meal.id) return null;
                const isCompleted = isMealCompleted(meal.id, mealType.key);
                
                return (
                  <TouchableOpacity
                    key={meal.id}
                    style={[
                      styles.mealCard,
                      isDark && styles.mealCardDark,
                      isCompleted && styles.mealCardCompleted,
                    ]}
                    onPress={() => handleMealToggle(meal, mealType.key)}
                  >
                    <LinearGradient
                      colors={
                        isCompleted 
                          ? ['#2ECC71', '#27AE60']
                          : isDark 
                            ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                            : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']
                      }
                      style={styles.mealCardGradient}
                    >
                      <View style={styles.mealCardContent}>
                        {/* Checkbox */}
                        <View style={[
                          styles.checkbox,
                          isCompleted && styles.checkboxCompleted,
                          isDark && !isCompleted && styles.checkboxDark,
                        ]}>
                          {isCompleted && (
                            <Ionicons name="checkmark" size={16} color="white" />
                          )}
                        </View>

                        {/* Meal Info */}
                        <View style={styles.mealInfo}>
                          <Text style={[
                            styles.mealName,
                            { color: isCompleted ? 'white' : (isDark ? '#FFFFFF' : '#2C3E50') },
                            isCompleted && styles.mealNameCompleted,
                          ]}>
                            {meal.name}
                          </Text>
                          
                          {meal.description && (
                            <Text style={[
                              styles.mealDescription,
                              { color: isCompleted ? 'rgba(255,255,255,0.8)' : (isDark ? '#B0B0B0' : '#7F8C8D') },
                            ]}>
                              {meal.description}
                            </Text>
                          )}

                          {/* Nutrition Info */}
                          <View style={styles.nutritionRow}>
                            <View style={styles.nutritionItem}>
                              <Text style={[
                                styles.nutritionValue,
                                { color: isCompleted ? 'white' : (isDark ? '#FFFFFF' : '#2C3E50') },
                              ]}>
                                {meal.calories}
                              </Text>
                              <Text style={[
                                styles.nutritionLabel,
                                { color: isCompleted ? 'rgba(255,255,255,0.8)' : (isDark ? '#B0B0B0' : '#7F8C8D') },
                              ]}>
                                kcal
                              </Text>
                            </View>
                            
                            <View style={styles.nutritionItem}>
                              <Text style={[
                                styles.nutritionValue,
                                { color: isCompleted ? 'white' : (isDark ? '#FFFFFF' : '#2C3E50') },
                              ]}>
                                {meal.protein}g
                              </Text>
                              <Text style={[
                                styles.nutritionLabel,
                                { color: isCompleted ? 'rgba(255,255,255,0.8)' : (isDark ? '#B0B0B0' : '#7F8C8D') },
                              ]}>
                                protein
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Action Icon */}
                        <Ionicons 
                          name={isCompleted ? "checkmark-circle" : "ellipse-outline"} 
                          size={24} 
                          color={isCompleted ? 'white' : (isDark ? '#B0B0B0' : '#BDC3C7')} 
                        />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        {!getCurrentDayPlan() && (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="restaurant-outline" 
              size={64} 
              color={isDark ? '#666666' : '#BDC3C7'} 
            />
            <Text style={[styles.emptyText, { color: isDark ? '#B0B0B0' : '#7F8C8D' }]}>
              Bu gün için öğün planlanmamış
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  daySelector: {
    maxHeight: 60,
    marginBottom: 16,
  },
  daySelectorContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  dayButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dayButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  dayButtonActiveDark: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  dayButtonTextDark: {
    color: '#FFFFFF',
  },
  dayButtonTextActive: {
    color: 'white',
  },
  dayButtonTextActiveDark: {
    color: 'white',
  },
  mealsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mealTypeSection: {
    marginBottom: 24,
  },
  mealTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealTypeTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  mealCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  mealCard: {
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealCardDark: {
    shadowOpacity: 0.3,
  },
  mealCardCompleted: {
    transform: [{ scale: 0.98 }],
  },
  mealCardGradient: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mealCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#BDC3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxDark: {
    borderColor: '#666666',
  },
  checkboxCompleted: {
    backgroundColor: '#2ECC71',
    borderColor: '#2ECC71',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  mealNameCompleted: {
    textDecorationLine: 'line-through',
  },
  mealDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  nutritionRow: {
    flexDirection: 'row',
    gap: 16,
  },
  nutritionItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  nutritionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
});