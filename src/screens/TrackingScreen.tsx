import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Alert,
  RefreshControl,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { usePlans } from '../hooks/usePlans';
import { HealthDataService, HealthData } from '../services/healthDataService';
import { MealCompletionService } from '../services/mealCompletionService';
import { useAuth } from '../hooks/useAuth';
import { UserProfile } from '../types/types';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

interface TrackingScreenProps {
  navigation?: {
    navigate: (screen: any, params?: any) => void;
  };
  user?: UserProfile | null;
}

interface WeeklyData {
  day: string;
  calories: number;
  water: number;
  steps: number;
}

export default function TrackingScreen({ navigation }: TrackingScreenProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { activePlan, loading: plansLoading } = usePlans();

  const [todayHealth, setTodayHealth] = useState<HealthData | null>(null);
  const [weeklyHealth, setWeeklyHealth] = useState<HealthData[]>([]);
  const [mealCompletionPercentage, setMealCompletionPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const dailyGoals = {
    calories: activePlan?.daily_calories || 2000,
    water: 2.5,
    steps: 10000,
    protein: activePlan?.daily_protein || 150,
    carbs: activePlan?.daily_carbs || 200,
    fat: activePlan?.daily_fat || 65
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load today's health data
      const todayData = await HealthDataService.getTodayHealthData(user.id);
      setTodayHealth(todayData);

      // Load weekly health data
      const weeklyData = await HealthDataService.getWeeklyHealthData(user.id);
      setWeeklyHealth(weeklyData);

      // Load meal completion percentage
      if (activePlan) {
        const today = new Date();
        const dayOfWeek = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'][today.getDay()];
        
        // Aktif plandaki günlük toplam öğün sayısını hesapla
        const dayPlan = activePlan.weekly_plan[dayOfWeek];
        const totalMeals = dayPlan ? 
          (dayPlan.breakfast?.length || 0) + 
          (dayPlan.lunch?.length || 0) + 
          (dayPlan.dinner?.length || 0) + 
          (dayPlan.snacks?.length || 0) : 0;
        
        const completionPercentage = await MealCompletionService.getDailyCompletionPercentage(
          user.id, 
          activePlan.id!, 
          dayOfWeek, 
          totalMeals
        );
        setMealCompletionPercentage(completionPercentage);
      }
    } catch (error) {
      console.error('Error loading tracking data:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getTodayCalories = (): number => {
    return todayHealth?.calories_consumed || 0;
  };

  const getTodayWater = (): number => {
    return todayHealth?.water_intake || 0;
  };

  const getTodaySteps = (): number => {
    return todayHealth?.steps || 0;
  };

  const formatWeeklyData = (): WeeklyData[] => {
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    return weeklyHealth.map((data, index) => ({
      day: days[index] || `Gün ${index + 1}`,
      calories: data.calories_consumed || 0,
      water: data.water_intake || 0,
      steps: data.steps || 0,
    }));
  };

  const handleAddMeal = () => {
    navigation?.navigate('MealLog');
  };

  const handleDrinkWater = async () => {
    if (!user) return;
    
    try {
      const currentWater = getTodayWater();
      await HealthDataService.updateWaterIntake(user.id, currentWater + 250);
      await loadData();
      
      Alert.alert('Başarılı', '250ml su eklendi!');
    } catch (error) {
      console.error('Error adding water:', error);
      Alert.alert('Hata', 'Su eklenirken bir hata oluştu');
    }
  };

  const handleEditGoal = () => {
    if (activePlan) {
      navigation?.navigate('editPlan', { plan: activePlan });
    } else {
      navigation?.navigate('editPlan');
    }
  };

  const handleShare = () => {
    Alert.alert('Paylaş', 'Paylaşım özelliği yakında eklenecek!');
  };

  const weeklyData = formatWeeklyData();
  const maxCalories = Math.max(...weeklyData.map(d => d.calories), dailyGoals.calories);
  const maxWater = Math.max(...weeklyData.map(d => d.water), dailyGoals.water);
  const maxSteps = Math.max(...weeklyData.map(d => d.steps), dailyGoals.steps);

  const todayCalories = getTodayCalories();
  const todayWater = getTodayWater();
  const todaySteps = getTodaySteps();

  const calorieProgress = (todayCalories / dailyGoals.calories) * 100;
  const waterProgress = (todayWater / dailyGoals.water) * 100;
  const stepsProgress = (todaySteps / dailyGoals.steps) * 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={isDark ? ['#1a1a2e', '#16213e'] : ['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>Takip</Text>
          <Text style={styles.subtitle}>
            {activePlan ? `Aktif Plan: ${activePlan.name}` : 'Henüz aktif plan yok'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Summary */}
        <View style={styles.summaryContainer}>
          <View style={[styles.glassCard, { backgroundColor: isDark ? colors.dark.surface : colors.card }]}>
              <Text style={[styles.cardTitle, { color: isDark ? colors.dark.text.primary : colors.text.primary }]}>Bugünün Özeti</Text>
            
            <View style={styles.summaryGrid}>
              {/* Calories */}
              <View style={styles.summaryItem}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="flame" size={24} color={colors.primary[500]} />
                </View>
                <Text style={[styles.summaryValue, { color: isDark ? colors.dark.text.primary : colors.text.primary }]}>
                  {todayCalories.toLocaleString()}
                </Text>
                <Text style={[styles.summaryLabel, { color: isDark ? colors.dark.text.secondary : colors.text.secondary }]}>
                  / {dailyGoals.calories.toLocaleString()} kcal
                </Text>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: isDark ? colors.dark.border : colors.neutral[200] }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min(100, calorieProgress)}%`,
                        backgroundColor: colors.primary[500] 
                      }
                    ]} 
                  />
                  </View>
                </View>
              </View>

              {/* Water */}
              <View style={styles.summaryItem}>
                <View style={[styles.iconContainer, { backgroundColor: colors.secondary + '20' }]}>
                  <Ionicons name="water" size={24} color={colors.info} />
                </View>
                <Text style={[styles.summaryValue, { color: isDark ? colors.dark.text.primary : colors.text.primary }]}>
                  {todayWater.toFixed(1)}L
                </Text>
                <Text style={[styles.summaryLabel, { color: isDark ? colors.dark.text.secondary : colors.text.secondary }]}>
                  / {dailyGoals.water}L
                </Text>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: isDark ? colors.dark.border : colors.neutral[200] }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${Math.min(100, waterProgress)}%`,
                          backgroundColor: colors.info 
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>

              {/* Meals */}
              <View style={styles.summaryItem}>
                <View style={[styles.iconContainer, { backgroundColor: colors.warning + '20' }]}>
                  <Ionicons name="restaurant" size={24} color={colors.warning} />
                </View>
                <Text style={[styles.summaryValue, { color: isDark ? colors.dark.text.primary : colors.text.primary }]}>
                  {Math.round(mealCompletionPercentage)}%
                </Text>
                <Text style={[styles.summaryLabel, { color: isDark ? colors.dark.text.secondary : colors.text.secondary }]}>
                  öğün tamamlandı
                </Text>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: isDark ? colors.dark.border : colors.neutral[200] }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${Math.min(100, mealCompletionPercentage)}%`,
                          backgroundColor: colors.warning 
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>

              {/* Steps */}
              <View style={styles.summaryItem}>
                <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="footsteps" size={24} color={colors.success} />
                </View>
                <Text style={[styles.summaryValue, { color: isDark ? colors.dark.text.primary : colors.text.primary }]}>
                  {todaySteps.toLocaleString()}
                </Text>
                <Text style={[styles.summaryLabel, { color: isDark ? colors.dark.text.secondary : colors.text.secondary }]}>
                  / {dailyGoals.steps.toLocaleString()} adım
                </Text>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: isDark ? colors.dark.border : colors.neutral[200] }]}>
                    <View style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min(100, stepsProgress)}%`, 
                        backgroundColor: colors.success[500] 
                      }
                    ]} />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Weekly Charts */}
        <View style={styles.chartsContainer}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.dark.text.primary : colors.text.primary }]}>Haftalık İlerleme</Text>
          
          {/* Calories Chart */}
          <View style={[styles.glassCard, { backgroundColor: isDark ? colors.dark.surface : colors.card }]}>
            <Text style={[styles.chartTitle, { color: isDark ? colors.dark.text.primary : colors.text.primary }]}>Kalori Takibi</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[styles.chartContainer, { width: Math.max(width - 60, weeklyData.length * 60) }]}>
                {weeklyData.map((data, index) => (
                  <View key={index} style={styles.chartBar}>
                      <View 
                        style={[
                        styles.bar, 
                        { 
                          height: (data.calories / maxCalories) * 100,
                          backgroundColor: colors.primary[500]
                        }
                      ]} 
                      />
                      <Text style={[styles.barLabel, { color: isDark ? colors.dark.text.secondary : colors.text.secondary }]}>{data.day}</Text>
                      <Text style={[styles.barValue, { color: isDark ? colors.dark.text.secondary : colors.text.secondary }]}>{data.calories}</Text>
                    </View>
                  ))}
              </View>
            </ScrollView>
          </View>

          {/* Water Chart */}
          <View style={[styles.glassCard, { backgroundColor: isDark ? colors.dark.surface : colors.card }]}>
            <Text style={[styles.chartTitle, { color: isDark ? colors.dark.text.primary : colors.text.primary }]}>Su Tüketimi (L)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[styles.chartContainer, { width: Math.max(width - 60, weeklyData.length * 60) }]}>
                {weeklyData.map((data, index) => (
                    <View key={index} style={styles.chartBar}>
                      <View 
                        style={[
                          styles.bar, 
                          { 
                            height: Math.max(4, (data.water / maxWater) * 100),
                            backgroundColor: colors.info[500]
                          }
                        ]} 
                      />
                      <Text style={[styles.barLabel, { color: isDark ? colors.dark.text.secondary : colors.text.secondary }]}>{data.day}</Text>
                      <Text style={[styles.barValue, { color: isDark ? colors.dark.text.secondary : colors.text.secondary }]}>{data.water}L</Text>
                    </View>
                  ))}

                </View>
              </ScrollView>
            </View>
  
            {/* Steps Chart */}
            <View style={[styles.glassCard, { backgroundColor: isDark ? colors.dark.surface : colors.card }]}>
              <Text style={[styles.chartTitle, { color: isDark ? colors.dark.text.primary : colors.text.primary }]}>Adım Sayısı</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={[styles.chartContainer, { width: Math.max(width - 60, weeklyData.length * 60) }]}>
                  {weeklyData.map((data, index) => (
                    <View key={index} style={styles.chartBar}>
                      <View 
                        style={[
                          styles.bar, 
                          { 
                            height: Math.max(4, (data.steps / maxSteps) * 100),
                            backgroundColor: colors.success[500]
                          }
                        ]} 
                      />
                      <Text style={[styles.barLabel, { color: isDark ? colors.dark.text.secondary : colors.text.secondary }]}>{data.day}</Text>
                      <Text style={[styles.barValue, { color: isDark ? colors.dark.text.secondary : colors.text.secondary }]}>{data.steps}</Text>
                    </View>
                  ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Weekly Goals */}
        <View style={styles.goalsContainer}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.dark.text.primary : colors.text.primary }]}>Haftalık Hedefler</Text>
          <View style={[styles.glassCard, { backgroundColor: isDark ? colors.dark.surface : colors.card }]}>
            <View style={styles.goalHeader}>
              <Ionicons name="flag" size={24} color={colors.primary[500]} />
              <Text style={[styles.goalTitle, { color: isDark ? colors.dark.text.primary : colors.text.primary }]}>Bu Haftaki İlerleme</Text>
            </View>
            
            <View style={styles.goalItem}>
              <Text style={[styles.goalText, { color: isDark ? colors.dark.text.primary : colors.text.primary }]}>
                Kalori: {(weeklyData.reduce((sum, day) => sum + day.calories, 0)).toLocaleString()} / {(dailyGoals.calories * 7).toLocaleString()}
              </Text>
              <View style={[styles.progressBar, { backgroundColor: isDark ? colors.dark.border : colors.neutral[200] }]}>
                <View style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(100, (weeklyData.reduce((sum, day) => sum + day.calories, 0) / (dailyGoals.calories * 7)) * 100)}%`, 
                    backgroundColor: colors.primary[500] 
                  }
                ]} />
              </View>
            </View>
            
            <View style={styles.goalItem}>
              <Text style={[styles.goalText, { color: isDark ? colors.dark.text.primary : colors.text.primary }]}>
                Su: {(weeklyData.reduce((sum, day) => sum + day.water, 0)).toFixed(1)}L / {(dailyGoals.water * 7).toFixed(1)}L
              </Text>
              <View style={[styles.progressBar, { backgroundColor: isDark ? colors.dark.border : colors.neutral[200] }]}>
                <View style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(100, (weeklyData.reduce((sum, day) => sum + day.water, 0) / (dailyGoals.water * 7)) * 100)}%`, 
                    backgroundColor: colors.info[500] 
                  }
                ]} />
              </View>
            </View>
            
            <View style={styles.goalItem}>
              <Text style={[styles.goalText, { color: isDark ? colors.dark.text.primary : colors.text.primary }]}>
                Adım: {(weeklyData.reduce((sum, day) => sum + day.steps, 0)).toLocaleString()} / {(dailyGoals.steps * 7).toLocaleString()}
              </Text>
              <View style={[styles.progressBar, { backgroundColor: isDark ? colors.dark.border : colors.neutral[200] }]}>
                <View style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(100, (weeklyData.reduce((sum, day) => sum + day.steps, 0) / (dailyGoals.steps * 7)) * 100)}%`, 
                    backgroundColor: colors.success 
                  }
                ]} />
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.dark.text.primary : colors.text.primary }]}>Hızlı Eylemler</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: isDark ? colors.dark.surface : colors.card }]} 
              onPress={handleAddMeal}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primary[500] + '20' }]}>
                <Ionicons name="restaurant" size={28} color={colors.primary[500]} />
              </View>
              <Text style={[styles.actionTitle, { color: isDark ? colors.dark.text.primary : colors.text.primary }]}>Öğün Ekle</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: isDark ? colors.dark.surface : colors.card }]} 
              onPress={handleDrinkWater}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.info[500] + '20' }]}>
                <Ionicons name="water" size={28} color={colors.info[500]} />
              </View>
              <Text style={[styles.actionTitle, { color: isDark ? colors.dark.text.primary : colors.text.primary }]}>Su İç (+250ml)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: isDark ? colors.dark.surface : colors.card }]} 
              onPress={handleEditGoal}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.warning[500] + '20' }]}>
                <Ionicons name="settings" size={28} color={colors.warning[500]} />
              </View>
              <Text style={[styles.actionTitle, { color: isDark ? colors.dark.text.primary : colors.text.primary }]}>Hedef Düzenle</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: isDark ? colors.dark.surface : colors.card }]} 
              onPress={handleShare}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.success[500] + '20' }]}>
                <Ionicons name="share-social" size={28} color={colors.success[500]} />
              </View>
              <Text style={[styles.actionTitle, { color: isDark ? colors.dark.text.primary : colors.text.primary }]}>Paylaş</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  summaryContainer: {
    padding: 20,
    marginTop: -20,
  },
  glassCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  chartsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 10,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  bar: {
    width: 24,
    borderRadius: 12,
    marginBottom: 8,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  barValue: {
    fontSize: 10,
  },
  goalsContainer: {
    paddingHorizontal: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  goalItem: {
    marginBottom: 16,
  },
  goalText: {
    fontSize: 14,
    marginBottom: 8,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
