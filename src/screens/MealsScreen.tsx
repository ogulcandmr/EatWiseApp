import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { MealService, MealData, DailyTotal } from '../services/mealService';
import { AuthService } from '../services/authService';
import AddMealModal from '../components/AddMealModal';

type FilterType = 'today' | 'week';

export default function MealsScreen() {
  const [meals, setMeals] = useState<MealData[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotal | null>(null);
  const [filter, setFilter] = useState<FilterType>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userId, setUserId] = useState<string>('');

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

  const handleRefresh = () => {
    setRefreshing(true);
    loadMeals();
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
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Bugün';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Dün';
    } else {
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
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
  }, {} as Record<string, MealData[]>);

  const sortedDates = Object.keys(groupedMeals).sort((a, b) => b.localeCompare(a));

  if (!userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Öğünlerim</Text>
        <Text style={styles.subtitle}>Günlük kalori ve makro takibi</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'today' && styles.filterButtonActive]}
          onPress={() => setFilter('today')}
        >
          <Text style={[styles.filterText, filter === 'today' && styles.filterTextActive]}>
            Bugün
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'week' && styles.filterButtonActive]}
          onPress={() => setFilter('week')}
        >
          <Text style={[styles.filterText, filter === 'week' && styles.filterTextActive]}>
            Bu Hafta
          </Text>
        </TouchableOpacity>
      </View>

      {/* Daily Totals */}
      {dailyTotals && (
        <View style={styles.totalsCard}>
          <Text style={styles.totalsTitle}>Günlük Toplam</Text>
          <View style={styles.totalsRow}>
            <View style={styles.totalItem}>
              <MaterialIcons name="local-fire-department" size={24} color="#FF5722" />
              <Text style={styles.totalValue}>{Math.round(dailyTotals.totalCalories)}</Text>
              <Text style={styles.totalLabel}>Kalori</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalValueSmall}>{Math.round(dailyTotals.totalProtein)}g</Text>
              <Text style={styles.totalLabel}>Protein</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalValueSmall}>{Math.round(dailyTotals.totalCarbs)}g</Text>
              <Text style={styles.totalLabel}>Karbonhidrat</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalValueSmall}>{Math.round(dailyTotals.totalFat)}g</Text>
              <Text style={styles.totalLabel}>Yağ</Text>
            </View>
          </View>
          <Text style={styles.mealCount}>{dailyTotals.mealCount} öğün</Text>
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
            <MaterialIcons name="restaurant" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Henüz öğün eklenmemiş</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'today' ? 'Bugün için' : 'Bu hafta için'} öğün eklemek için + butonuna tıklayın
            </Text>
          </View>
        ) : (
          sortedDates.map(date => (
            <View key={date} style={styles.dateSection}>
              <Text style={styles.dateHeader}>{formatDate(date)}</Text>
              {groupedMeals[date].map(meal => (
                <View key={meal.id} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <View style={styles.mealTitleRow}>
                      <Text style={styles.mealTypeEmoji}>
                        {MealService.getMealTypeEmoji(meal.meal_type)}
                      </Text>
                      <View style={styles.mealInfo}>
                        <Text style={styles.mealName}>{meal.name}</Text>
                        <Text style={styles.mealType}>
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

                  <View style={styles.mealMacros}>
                    <View style={styles.macroItem}>
                      <Text style={styles.macroValue}>{Math.round(meal.total_calories)}</Text>
                      <Text style={styles.macroLabel}>kcal</Text>
                    </View>
                    <View style={styles.macroDivider} />
                    <View style={styles.macroItem}>
                      <Text style={styles.macroValue}>{Math.round(meal.total_protein)}g</Text>
                      <Text style={styles.macroLabel}>Protein</Text>
                    </View>
                    <View style={styles.macroDivider} />
                    <View style={styles.macroItem}>
                      <Text style={styles.macroValue}>{Math.round(meal.total_carbs)}g</Text>
                      <Text style={styles.macroLabel}>Karbonhidrat</Text>
                    </View>
                    <View style={styles.macroDivider} />
                    <View style={styles.macroItem}>
                      <Text style={styles.macroValue}>{Math.round(meal.total_fat)}g</Text>
                      <Text style={styles.macroLabel}>Yağ</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <MaterialIcons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Add Meal Modal */}
      <AddMealModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onMealAdded={loadMeals}
        userId={userId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
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
  totalsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
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
  mealCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
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
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
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
    backgroundColor: '#f5f5f5',
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
  mealType: {
    fontSize: 12,
    color: '#666',
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
  macroLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
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
    elevation: 8,
  },
});
