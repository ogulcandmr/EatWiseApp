import React, { useState, useEffect, useCallback } from 'react';
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
  Pressable
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

export default function MealsScreen() {
  const { isDark } = useTheme();
  const [meals, setMeals] = useState<MealData[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotal | null>(null);
  const [filter, setFilter] = useState<FilterType>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealData | null>(null);
  const [userId, setUserId] = useState<string>('');

  // Global store
  const { 
    currentPlan, 
    activePlan, 
    planMealSync, 
    syncPlanToMeals,
    setPlanMealSync 
  } = useAppStore();

  // Kullanıcı ID'sini al
  useEffect(() => {
    const fetchUserId = async () => {
      const user = await AuthService.getCurrentUser();
      if (user) {
        setUserId(user.id);
      }
    };
    fetchUserId();
  }, []);

  // Öğünleri yükle
  const loadMeals = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      let fetchedMeals: MealData[];

      if (filter === 'today') {
        fetchedMeals = await MealService.getTodayMeals(userId);
      } else {
        fetchedMeals = await MealService.getWeekMeals(userId);
      }

      setMeals(fetchedMeals);

      // Günlük toplamları hesapla
      if (filter === 'today') {
        const totals = MealService.calculateDailyTotals(fetchedMeals);
        setDailyTotals(totals);
      } else {
        // Haftalık görünümde bugünün toplamlarını göster
        const todayMeals = fetchedMeals.filter(meal => {
          const mealDate = new Date(meal.created_at!).toDateString();
          const today = new Date().toDateString();
          return mealDate === today;
        });
        const totals = MealService.calculateDailyTotals(todayMeals);
        setDailyTotals(totals);
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Öğünler yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, filter]);

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
      setPlanMealSync(false); // Sync flag'ini sıfırla
    }
  }, [planMealSync, currentPlan, activePlan, loadMeals, setPlanMealSync]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMeals();
  };

  const handleMealDetail = (meal: MealData) => {
    setSelectedMeal(meal);
    setShowDetailModal(true);
  };

  const handleDeleteMeal = (mealId: string, mealName: string) => {
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
    const date = new Date(dateString + 'T00:00:00'); // UTC offset sorununu çöz
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Sadece tarih kısmını karşılaştır
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Bugün';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Dün';
    } else {
      // Hafta içi günlerini göster
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

  // Öğünleri tarihe göre grupla ve filtreye göre filtrele
  const groupedMeals = meals.reduce((groups, meal) => {
    const date = meal.created_at?.split('T')[0] || '';
    
    // Eğer "bugün" filtresi aktifse, sadece bugünkü öğünleri göster
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      if (date !== today) {
        return groups; // Bugün değilse gruba ekleme
      }
    }
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(meal);
    return groups;
  }, {} as Record<string, MealData[]>);

  const sortedDates = Object.keys(groupedMeals).sort((a, b) => b.localeCompare(a));

  if (!userId) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#2C3E50', '#34495E'] : ['#10B981', '#059669']}
        style={styles.header}
      >
        <Text style={styles.title}>Öğünlerim</Text>
        <Text style={styles.subtitle}>Günlük kalori ve makro takibi</Text>
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

      {/* Daily Totals */}
      {dailyTotals && (
        <View style={[styles.totalsCard, isDark && styles.totalsCardDark]}>
          <Text style={[styles.totalsTitle, isDark && styles.totalsTitleDark]}>
            {filter === 'today' ? 'Bugünkü' : 'Haftalık'} Toplam
          </Text>
          <View style={styles.totalsRow}>
            <View style={styles.totalItem}>
              <MaterialIcons name="local-fire-department" size={24} color="#FF5722" />
              <Text style={styles.totalValue}>{Math.round(dailyTotals.totalCalories)}</Text>
              <Text style={[styles.totalLabel, isDark && styles.totalLabelDark]}>Kalori</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalValueSmall}>{Math.round(dailyTotals.totalProtein)}g</Text>
              <Text style={[styles.totalLabel, isDark && styles.totalLabelDark]}>Protein</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalValueSmall}>{Math.round(dailyTotals.totalCarbs)}g</Text>
              <Text style={[styles.totalLabel, isDark && styles.totalLabelDark]}>Karbonhidrat</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalValueSmall}>{Math.round(dailyTotals.totalFat)}g</Text>
              <Text style={[styles.totalLabel, isDark && styles.totalLabelDark]}>Yağ</Text>
            </View>
          </View>
          <Text style={[styles.mealCount, isDark && styles.mealCountDark]}>{dailyTotals.mealCount} öğün</Text>
        </View>
      )}

      {/* Meals List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        ) : meals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="restaurant" size={64} color={isDark ? '#555' : '#ccc'} />
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>Henüz öğün eklenmemiş</Text>
            <Text style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}>
              {filter === 'today' ? 'Bugün için' : 'Bu hafta için'} öğün eklemek için + butonuna tıklayın
            </Text>
          </View>
        ) : (
          sortedDates.map(date => (
            <View key={date} style={styles.dateSection}>
              <View style={[styles.dateHeader, isDark && styles.dateHeaderDark]}>
                <Text style={[{ 
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: '#333'
                }, isDark && { color: colors.dark.text.primary }]}>{formatDate(date)}</Text>
              </View>
              {groupedMeals[date].map(meal => (
                <TouchableOpacity
                  key={meal.id}
                  onPress={() => handleMealDetail(meal)}
                  activeOpacity={0.7}
                  style={styles.mealCard}
                >
                  <View style={[styles.mealCard, isDark && styles.mealCardDark]}>
                  <View style={styles.mealHeader}>
                    <View style={styles.mealTitleRow}>
                      <Text style={styles.mealTypeEmoji}>
                        {MealService.getMealTypeEmoji(meal.meal_type)}
                      </Text>
                      <View style={styles.mealInfo}>
                        <Text style={[styles.mealName, isDark && styles.mealNameDark]}>{meal.name}</Text>
                        <Text style={[styles.mealType, isDark && styles.mealTypeDark]}>
                          {MealService.getMealTypeName(meal.meal_type)} • {formatTime(meal.created_at!)}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteMeal(meal.id!, meal.name)}
                      style={styles.deleteButton}
                    >
                      <MaterialIcons name="delete" size={20} color="#F44336" />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.mealMacros, { borderTopColor: isDark ? '#444' : '#f0f0f0' }]}>
                    <View style={styles.macroItem}>
                      <Text style={[styles.macroValue, isDark && styles.macroValueDark]}>{Math.round(meal.total_calories)}</Text>
                      <Text style={[styles.macroLabel, isDark && styles.macroLabelDark]}>kcal</Text>
                    </View>
                    <View style={[styles.macroDivider, { backgroundColor: isDark ? '#444' : '#e0e0e0' }]} />
                    <View style={styles.macroItem}>
                      <Text style={[styles.macroValue, isDark && styles.macroValueDark]}>{Math.round(meal.total_protein)}g</Text>
                      <Text style={[styles.macroLabel, isDark && styles.macroLabelDark]}>Protein</Text>
                    </View>
                    <View style={[styles.macroDivider, { backgroundColor: isDark ? '#444' : '#e0e0e0' }]} />
                    <View style={styles.macroItem}>
                      <Text style={[styles.macroValue, isDark && styles.macroValueDark]}>{Math.round(meal.total_carbs)}g</Text>
                      <Text style={[styles.macroLabel, isDark && styles.macroLabelDark]}>Karbonhidrat</Text>
                    </View>
                    <View style={styles.macroDivider} />
                    <View style={styles.macroItem}>
                      <Text style={[styles.macroValue, isDark && styles.macroValueDark]}>{Math.round(meal.total_fat)}g</Text>
                      <Text style={[styles.macroLabel, isDark && styles.macroLabelDark]}>Yağ</Text>
                    </View>
                  </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: isDark ? '#667eea' : '#4CAF50' }]}
        onPress={() => setShowAddModal(true)}
      >
        <MaterialIcons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Add Meal Modal */}
      <AddMealModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onMealAdded={loadMeals}
        userId={userId}
      />

      {/* Meal Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
          <View style={[styles.header, { backgroundColor: isDark ? '#2C3E50' : '#4CAF50' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <MaterialIcons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.title}>Öğün Detayı</Text>
              <View style={{ width: 24 }} />
            </View>
          </View>

          {selectedMeal && (
            <ScrollView style={styles.scrollView}>
              <View style={[styles.mealCard, isDark && styles.mealCardDark, { marginTop: 20 }]}>
                <View style={styles.mealHeader}>
                  <View style={styles.mealTitleRow}>
                    <Text style={styles.mealTypeEmoji}>
                      {MealService.getMealTypeEmoji(selectedMeal.meal_type)}
                    </Text>
                    <View style={styles.mealInfo}>
                      <Text style={[styles.mealName, isDark && styles.mealNameDark, { fontSize: 20 }]}>
                        {selectedMeal.name}
                      </Text>
                      <Text style={[styles.mealType, isDark && styles.mealTypeDark, { fontSize: 14 }]}>
                        {MealService.getMealTypeName(selectedMeal.meal_type)} • {formatTime(selectedMeal.created_at!)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.mealMacros, { borderTopColor: isDark ? '#444' : '#f0f0f0', paddingTop: 20 }]}>
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, isDark && styles.macroValueDark, { fontSize: 24 }]}>
                      {Math.round(selectedMeal.total_calories)}
                    </Text>
                    <Text style={[styles.macroLabel, isDark && styles.macroLabelDark, { fontSize: 12 }]}>kcal</Text>
                  </View>
                  <View style={[styles.macroDivider, { backgroundColor: isDark ? '#444' : '#e0e0e0' }]} />
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, isDark && styles.macroValueDark, { fontSize: 20 }]}>
                      {Math.round(selectedMeal.total_protein)}g
                    </Text>
                    <Text style={[styles.macroLabel, isDark && styles.macroLabelDark, { fontSize: 12 }]}>Protein</Text>
                  </View>
                  <View style={[styles.macroDivider, { backgroundColor: isDark ? '#444' : '#e0e0e0' }]} />
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, isDark && styles.macroValueDark, { fontSize: 20 }]}>
                      {Math.round(selectedMeal.total_carbs)}g
                    </Text>
                    <Text style={[styles.macroLabel, isDark && styles.macroLabelDark, { fontSize: 12 }]}>Karbonhidrat</Text>
                  </View>
                  <View style={[styles.macroDivider, { backgroundColor: isDark ? '#444' : '#e0e0e0' }]} />
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, isDark && styles.macroValueDark, { fontSize: 20 }]}>
                      {Math.round(selectedMeal.total_fat)}g
                    </Text>
                    <Text style={[styles.macroLabel, isDark && styles.macroLabelDark, { fontSize: 12 }]}>Yağ</Text>
                  </View>
                </View>

                {selectedMeal.portion && (
                   <View style={{ marginTop: 20 }}>
                     <Text style={[styles.totalsTitle, isDark && styles.totalsTitleDark, { marginBottom: 15 }]}>
                       Porsiyon Bilgisi
                     </Text>
                     <View style={{
                       backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                       padding: 12,
                       borderRadius: 8
                     }}>
                       <Text style={[styles.mealName, isDark && styles.mealNameDark, { fontSize: 16 }]}>
                         {selectedMeal.portion}
                       </Text>
                     </View>
                   </View>
                 )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
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
    padding: 20,
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
  totalsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  totalsTitleDark: {
    color: colors.dark.text.primary,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  totalItem: {
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5722',
    marginTop: 5,
  },
  totalValueSmall: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  totalLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  totalLabelDark: {
    color: colors.dark.text.secondary,
  },
  mealCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
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
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mealCardDark: {
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
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
  mealTypeEmoji: {
    fontSize: 32,
    marginRight: 12,
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
  mealType: {
    fontSize: 12,
    color: '#666',
  },
  mealTypeDark: {
    color: colors.dark.text.secondary,
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
  macroItem: {
    alignItems: 'center',
    flex: 1,
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
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalContentDark: {
    backgroundColor: colors.dark.surface,
  },
  modalHeader: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalBody: {
    flex: 1,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  nutritionItem: {
    width: '48%',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  nutritionEmoji: {
    fontSize: 24,
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
  closeButton: {
    borderRadius: 15,
    overflow: 'hidden',
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
