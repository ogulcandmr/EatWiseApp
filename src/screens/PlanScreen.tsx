import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  RefreshControl,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { usePlans } from '../hooks/usePlans';
import { PlanCard } from '../components/PlanCard';
import { DietPlan } from '../services/planService';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function PlanScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const {
    plans,
    activePlan,
    loading,
    error,
    loadPlans,
    activatePlan,
    deletePlan,
    pastPlans,
    totalPlans
  } = usePlans();

  const [refreshing, setRefreshing] = useState(false);

  // Refresh plans when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [loadPlans])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlans();
    setRefreshing(false);
  };

  const handleEdit = (plan?: DietPlan) => {
    // App.tsx'deki custom navigasyon sistemi için
    if (navigation?.navigate) {
      navigation.navigate('editPlan', { plan });
    }
  };

  const handleViewProgress = (plan: DietPlan) => {
    // App.tsx'deki custom navigasyon sistemi için
    if (navigation?.navigate) {
      navigation.navigate('tracking');
    }
  };

  const handleViewDetail = (plan: DietPlan) => {
    // Modal veya yeni ekran açarak detaylı görünüm göster
    navigation.navigate('planDetail', { plan });
  };

  const handleActivate = async (planId: string) => {
    try {
      await activatePlan(planId);
      Alert.alert('Başarılı', 'Plan aktifleştirildi!');
    } catch (error) {
      Alert.alert('Hata', 'Plan aktifleştirilemedi');
    }
  };

  const handleDelete = async (planId: string) => {
    Alert.alert(
      'Planı Sil',
      'Bu planı silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlan(planId);
              Alert.alert('Başarılı', 'Plan silindi!');
            } catch (error) {
              Alert.alert('Hata', 'Plan silinemedi');
            }
          }
        }
      ]
    );
  };

  const handleCreateNew = () => {
    // App.tsx'deki custom navigasyon sistemi için
    if (navigation?.navigate) {
      navigation.navigate('editPlan');
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={[styles.loadingText, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
            Planlar yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <LinearGradient
        colors={isDark ? ['#1a1a1a', '#2d2d2d'] : ['#f8f9fa', '#e9ecef']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
              Beslenme Planları
            </Text>
            <Text style={[styles.headerSubtitle, { color: isDark ? '#B0B0B0' : '#7F8C8D' }]}>
              {totalPlans} plan • {activePlan ? '1 aktif' : 'Aktif plan yok'}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateNew}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.createButtonGradient}
            >
              <Ionicons name="add" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? '#FFFFFF' : '#667eea'}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={24} color="#E74C3C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Active Plan Section */}
          {activePlan && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                  Aktif Plan
                </Text>
                <View style={styles.activeBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#2ECC71" />
                  <Text style={styles.activeBadgeText}>Aktif</Text>
                </View>
              </View>
              
              <PlanCard
                plan={activePlan}
                onEdit={handleEdit}
                onViewProgress={handleViewProgress}
                onViewDetail={handleViewDetail}
                onDelete={handleDelete}
                showActions={true}
              />
            </View>
          )}

          {/* All Plans Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
              Tüm Planlar
            </Text>
            
            {plans.length === 0 ? (
              <View style={styles.emptyContainer}>
                <LinearGradient
                  colors={isDark ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']}
                  style={styles.emptyCard}
                >
                  <Ionicons 
                    name="restaurant-outline" 
                    size={64} 
                    color={isDark ? '#666666' : '#BDC3C7'} 
                  />
                  <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                    Henüz plan yok
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: isDark ? '#B0B0B0' : '#7F8C8D' }]}>
                    İlk beslenme planınızı oluşturun
                  </Text>
                  
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={handleCreateNew}
                  >
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.emptyButtonGradient}
                    >
                      <Ionicons name="add" size={20} color="white" />
                      <Text style={styles.emptyButtonText}>Plan Oluştur</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            ) : (
              <View style={styles.plansContainer}>
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onEdit={handleEdit}
                    onViewProgress={handleViewProgress}
                    onViewDetail={handleViewDetail}
                    onActivate={!plan.is_active ? handleActivate : undefined}
                    onDelete={handleDelete}
                    showActions={true}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Quick Stats */}
          {plans.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                İstatistikler
              </Text>
              
              <LinearGradient
                colors={isDark ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']}
                style={styles.statsCard}
              >
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                      {totalPlans}
                    </Text>
                    <Text style={[styles.statLabel, { color: isDark ? '#B0B0B0' : '#7F8C8D' }]}>
                      Toplam Plan
                    </Text>
                  </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                      {activePlan ? 1 : 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: isDark ? '#B0B0B0' : '#7F8C8D' }]}>
                      Aktif Plan
                    </Text>
                  </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                      {pastPlans.length}
                    </Text>
                    <Text style={[styles.statLabel, { color: isDark ? '#B0B0B0' : '#7F8C8D' }]}>
                      Geçmiş Plan
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  background: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  createButton: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#2ECC71',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    marginHorizontal: 16,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  plansContainer: {
    gap: 8,
  },
  statsCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 16,
  },
});
