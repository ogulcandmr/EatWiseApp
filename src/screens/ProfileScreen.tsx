import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UserProfile } from '../types/types';
import { AuthService } from '../services/authService';
import { calculateAllHealthMetrics, HealthMetrics } from '../utils/healthCalculations';
import ProfileEditScreen from './ProfileEditScreen';
import { useTheme } from '../context/ThemeContext';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme';

export default function ProfileScreen() {
  const { isDark, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [waterReminders, setWaterReminders] = useState(true);
  const [showEditScreen, setShowEditScreen] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);

  const loadCurrentUser = async () => {
    try {
      const { data: { session } } = await (await import('../services/supabase')).supabase.auth.getSession();
      const uid = session?.user?.id;
      if (uid) {
        const updatedUser = await AuthService.getUserProfile(uid);
        setCurrentUser(updatedUser);
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Oturum bilgisi alınamadı:', error);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  // Health metrics calculation effect - moved to top level to comply with hook rules
  useEffect(() => {
    if (currentUser?.age && currentUser?.weight && currentUser?.height && 
        currentUser?.gender && currentUser?.activityLevel && currentUser?.goal) {
      try {
        const metrics = calculateAllHealthMetrics({
          age: currentUser.age,
          weight: currentUser.weight,
          height: currentUser.height,
          gender: currentUser.gender,
          activityLevel: currentUser.activityLevel,
          goal: currentUser.goal
        });
        setHealthMetrics(metrics);
      } catch (error) {
        console.error('Metrik hesaplama hatası:', error);
      }
    }
  }, [currentUser]);

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.logout();
            } catch (error) {
              Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
            }
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    setShowEditScreen(true);
  };

  const handleSaveProfile = async () => {
    await loadCurrentUser();
    setShowEditScreen(false);
  };

  const handleCancelEdit = () => {
    setShowEditScreen(false);
  };

  const handleShowGoals = () => {
    setShowGoalsModal(true);
  };

  const handleShowPersonalInfo = () => {
    setShowPersonalInfoModal(true);
  };

  const handleCloseGoals = () => {
    setShowGoalsModal(false);
  };

  const handleClosePersonalInfo = () => {
    setShowPersonalInfoModal(false);
  };

  // Define labels at top level
  const goalLabels: Record<string, string> = {
    weight_loss: 'Kilo Verme',
    weight_gain: 'Kilo Alma',
    maintenance: 'Koruma',
    muscle_gain: 'Kas Yapma'
  };

  const activityLabels: Record<string, string> = {
    low: 'Düşük',
    moderate: 'Orta',
    high: 'Yüksek'
  };

  // Profil düzenleme ekranını göster
  if (showEditScreen) {
    return (
      <ProfileEditScreen
        user={currentUser}
        onSave={handleSaveProfile}
        onCancel={handleCancelEdit}
      />
    );
  }

  // Profil tamamlanmamışsa düzenleme ekranını göster
  if (!currentUser?.age || !currentUser?.weight || !currentUser?.height) {
    return (
      <ProfileEditScreen
        user={currentUser}
        onSave={handleSaveProfile}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Goals Modal */}
      <Modal
        visible={showGoalsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, isDark && styles.modalContainerDark]}>
          <View style={[styles.modalHeader, isDark && styles.modalHeaderDark]}>
            <TouchableOpacity onPress={handleCloseGoals}>
              <MaterialIcons name="close" size={24} color={isDark ? colors.dark.text.primary : "#333"} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, isDark && styles.textDark]}>Hedeflerim</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.goalSection}>
              <Text style={[styles.goalSectionTitle, isDark && styles.textDark]}>Mevcut Hedef</Text>
              <View style={[styles.currentGoalCard, isDark && styles.cardDark]}>
                <MaterialIcons name="flag" size={32} color="#FF9800" />
                <View style={styles.goalInfo}>
                  <Text style={[styles.goalTitle, isDark && styles.textDark]}>
                    {goalLabels[currentUser?.goal || 'maintenance']}
                  </Text>
                  <Text style={[styles.goalDescription, isDark && styles.textSecondaryDark]}>
                    {currentUser?.goal === 'weight_loss' && 'Sağlıklı bir şekilde kilo verin'}
                    {currentUser?.goal === 'weight_gain' && 'Sağlıklı bir şekilde kilo alın'}
                    {currentUser?.goal === 'maintenance' && 'Mevcut kilonuzu koruyun'}
                    {currentUser?.goal === 'muscle_gain' && 'Kas kütlenizi artırın'}
                  </Text>
                </View>
              </View>
            </View>
            
            {healthMetrics && (
              <View style={styles.goalSection}>
                <Text style={[styles.goalSectionTitle, isDark && styles.textDark]}>Günlük Hedefler</Text>
                <View style={styles.metricsGrid}>
                  <View style={[styles.metricCard, isDark && styles.cardDark]}>
                    <MaterialIcons name="local-fire-department" size={24} color="#FF5722" />
                    <Text style={[styles.metricValue, isDark && styles.textDark]}>{healthMetrics.dailyCalorieGoal}</Text>
                    <Text style={[styles.metricLabel, isDark && styles.textSecondaryDark]}>Kalori</Text>
                  </View>
                  <View style={[styles.metricCard, isDark && styles.cardDark]}>
                    <MaterialIcons name="fitness-center" size={24} color="#2196F3" />
                    <Text style={[styles.metricValue, isDark && styles.textDark]}>{healthMetrics.proteinGoal}g</Text>
                    <Text style={[styles.metricLabel, isDark && styles.textSecondaryDark]}>Protein</Text>
                  </View>
                  <View style={[styles.metricCard, isDark && styles.cardDark]}>
                    <MaterialIcons name="grain" size={24} color="#FF9800" />
                    <Text style={[styles.metricValue, isDark && styles.textDark]}>{healthMetrics.carbsGoal}g</Text>
                    <Text style={[styles.metricLabel, isDark && styles.textSecondaryDark]}>Karbonhidrat</Text>
                  </View>
                  <View style={[styles.metricCard, isDark && styles.cardDark]}>
                    <MaterialIcons name="opacity" size={24} color="#4CAF50" />
                    <Text style={[styles.metricValue, isDark && styles.textDark]}>{healthMetrics.fatGoal}g</Text>
                    <Text style={[styles.metricLabel, isDark && styles.textSecondaryDark]}>Yağ</Text>
                  </View>
                </View>
              </View>
            )}
            
            <TouchableOpacity style={styles.editGoalsButton} onPress={() => {
              handleCloseGoals();
              handleEditProfile();
            }}>
              <MaterialIcons name="edit" size={20} color="white" />
              <Text style={styles.editGoalsButtonText}>Hedefleri Düzenle</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Personal Info Modal */}
      <Modal
        visible={showPersonalInfoModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, isDark && styles.modalContainerDark]}>
          <View style={[styles.modalHeader, isDark && styles.modalHeaderDark]}>
            <TouchableOpacity onPress={handleClosePersonalInfo}>
              <MaterialIcons name="close" size={24} color={isDark ? colors.dark.text.primary : "#333"} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, isDark && styles.textDark]}>Kişisel Bilgiler</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.infoSection}>
              <Text style={[styles.infoSectionTitle, isDark && styles.textDark]}>Temel Bilgiler</Text>
              <View style={[styles.infoGrid, isDark && styles.cardDark]}>
                <View style={styles.infoItem}>
                  <MaterialIcons name="person" size={24} color="#4CAF50" />
                  <View style={styles.infoItemContent}>
                    <Text style={[styles.infoItemLabel, isDark && styles.textSecondaryDark]}>Ad</Text>
                    <Text style={[styles.infoItemValue, isDark && styles.textDark]}>{currentUser?.name || '-'}</Text>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <MaterialIcons name="email" size={24} color="#2196F3" />
                  <View style={styles.infoItemContent}>
                    <Text style={[styles.infoItemLabel, isDark && styles.textSecondaryDark]}>E-posta</Text>
                    <Text style={[styles.infoItemValue, isDark && styles.textDark]}>{currentUser?.email || '-'}</Text>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <MaterialIcons name="cake" size={24} color="#FF9800" />
                  <View style={styles.infoItemContent}>
                    <Text style={[styles.infoItemLabel, isDark && styles.textSecondaryDark]}>Yaş</Text>
                    <Text style={[styles.infoItemValue, isDark && styles.textDark]}>{currentUser?.age || '-'}</Text>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <MaterialIcons name={currentUser?.gender === 'male' ? 'male' : 'female'} size={24} color="#9C27B0" />
                  <View style={styles.infoItemContent}>
                    <Text style={[styles.infoItemLabel, isDark && styles.textSecondaryDark]}>Cinsiyet</Text>
                    <Text style={[styles.infoItemValue, isDark && styles.textDark]}>
                      {currentUser?.gender === 'male' ? 'Erkek' : 'Kadın'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={[styles.infoSectionTitle, isDark && styles.textDark]}>Fiziksel Bilgiler</Text>
              <View style={[styles.infoGrid, isDark && styles.cardDark]}>
                <View style={styles.infoItem}>
                  <MaterialIcons name="monitor-weight" size={24} color="#FF5722" />
                  <View style={styles.infoItemContent}>
                    <Text style={[styles.infoItemLabel, isDark && styles.textSecondaryDark]}>Kilo</Text>
                    <Text style={[styles.infoItemValue, isDark && styles.textDark]}>{currentUser?.weight || '-'} kg</Text>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <MaterialIcons name="height" size={24} color="#2196F3" />
                  <View style={styles.infoItemContent}>
                    <Text style={[styles.infoItemLabel, isDark && styles.textSecondaryDark]}>Boy</Text>
                    <Text style={[styles.infoItemValue, isDark && styles.textDark]}>{currentUser?.height || '-'} cm</Text>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <MaterialIcons name="directions-run" size={24} color="#4CAF50" />
                  <View style={styles.infoItemContent}>
                    <Text style={[styles.infoItemLabel, isDark && styles.textSecondaryDark]}>Aktivite Seviyesi</Text>
                    <Text style={[styles.infoItemValue, isDark && styles.textDark]}>
                      {activityLabels[currentUser?.activityLevel || 'moderate']}
                    </Text>
                  </View>
                </View>
                {healthMetrics?.bmi && (
                  <View style={styles.infoItem}>
                    <MaterialIcons name="analytics" size={24} color="#FF9800" />
                    <View style={styles.infoItemContent}>
                      <Text style={[styles.infoItemLabel, isDark && styles.textSecondaryDark]}>BMI</Text>
                      <Text style={[styles.infoItemValue, isDark && styles.textDark]}>{healthMetrics.bmi.toFixed(1)}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
            
            <TouchableOpacity style={styles.editInfoButton} onPress={() => {
              handleClosePersonalInfo();
              handleEditProfile();
            }}>
              <MaterialIcons name="edit" size={20} color="white" />
              <Text style={styles.editInfoButtonText}>Bilgileri Düzenle</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <ScrollView style={styles.scrollView}>
        {/* Profile Header with Gradient */}
        <LinearGradient
          colors={isDark ? ['#1E3A8A', '#1E40AF', '#2563EB'] : ['#10B981', '#059669'] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHeader}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <MaterialIcons name="account-circle" size={80} color="white" />
            </View>
          </View>
          <Text style={styles.name}>{currentUser?.name || 'Kullanıcı'}</Text>
          <Text style={styles.email}>{currentUser?.email || ''}</Text>
          <View style={styles.planBadge}>
            <MaterialIcons name="star" size={16} color="#FFD700" />
            <Text style={styles.planText}>
              {currentUser?.planType === 'pro' ? 'Pro' : 'Free'} Plan
            </Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <MaterialIcons name="edit" size={20} color="white" />
            <Text style={styles.editButtonText}>Profili Düzenle</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Stats */}
        <View style={[styles.statsCard, isDark && styles.cardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textDark]}>Profil Bilgileri</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && { color: colors.dark.primary }]}>{currentUser?.age || '-'}</Text>
              <Text style={[styles.statLabel, isDark && styles.textSecondaryDark]}>Yaş</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && { color: colors.dark.primary }]}>{currentUser?.weight || '-'} kg</Text>
              <Text style={[styles.statLabel, isDark && styles.textSecondaryDark]}>Kilo</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && { color: colors.dark.primary }]}>{currentUser?.height || '-'} cm</Text>
              <Text style={[styles.statLabel, isDark && styles.textSecondaryDark]}>Boy</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && { color: colors.dark.primary }]}>{healthMetrics?.bmi?.toFixed(1) || '-'}</Text>
              <Text style={[styles.statLabel, isDark && styles.textSecondaryDark]}>BMI</Text>
            </View>
          </View>
          <View style={styles.additionalInfo}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoValue, isDark && styles.textDark]}>
                {currentUser?.gender === 'male' ? 'Erkek' : 'Kadın'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>Aktivite Seviyesi:</Text>
              <Text style={[styles.infoValue, isDark && styles.textDark]}>
                {activityLabels[currentUser?.activityLevel || 'moderate']}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>Hedef:</Text>
              <Text style={[styles.infoValue, isDark && styles.textDark]}>
                {goalLabels[currentUser?.goal || 'maintenance']}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={[styles.settingsCard, isDark && styles.cardDark]}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name={isDark ? "dark-mode" : "light-mode"} size={24} color={isDark ? "#FFB74D" : "#FF9800"} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, isDark && styles.textDark]}>Karanlık Mod</Text>
                <Text style={[styles.settingSubtitle, isDark && styles.textSecondaryDark]}>Gece görünümünü etkinleştir</Text>
              </View>
            </View>
            <Switch 
              value={isDark} 
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isDark ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="notifications-active" size={24} color="#4CAF50" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, isDark && styles.textDark]}>Bildirimler</Text>
                <Text style={[styles.settingSubtitle, isDark && styles.textSecondaryDark]}>Uyarıları etkinleştir</Text>
              </View>
            </View>
            <Switch 
              value={notificationsEnabled} 
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={notificationsEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>

          <View style={[styles.settingItem, { marginBottom: 0 }]}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="local-drink" size={24} color="#2196F3" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, isDark && styles.textDark]}>Su Hatırlatıcıları</Text>
                <Text style={[styles.settingSubtitle, isDark && styles.textSecondaryDark]}>Günlük su hedefi için uyarılar</Text>
              </View>
            </View>
            <Switch 
              value={waterReminders} 
              onValueChange={setWaterReminders}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={waterReminders ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* AI Recommendations Card */}
        <View style={[styles.aiCard, isDark && styles.cardDark]}>
          <View style={styles.aiHeader}>
            <MaterialIcons name="psychology" size={28} color="#9C27B0" />
            <Text style={[styles.aiTitle, isDark && styles.textDark]}>AI Önerileri</Text>
          </View>
          <Text style={[styles.aiDescription, isDark && styles.textSecondaryDark]}>
            Kişiselleştirilmiş beslenme ve egzersiz önerilerinizi görüntüleyin
          </Text>
          
          <View style={styles.aiRecommendations}>
            {healthMetrics && (
              <>
                <View style={[styles.recommendationItem, isDark && styles.cardDark]}>
                  <MaterialIcons name="restaurant" size={20} color="#FF5722" />
                  <Text style={[styles.recommendationText, isDark && styles.textDark]}>
                    Günlük {healthMetrics.dailyCalorieGoal} kalori hedefi için protein ağırlıklı öğünler tercih edin
                  </Text>
                </View>
                
                <View style={[styles.recommendationItem, isDark && styles.cardDark]}>
                  <MaterialIcons name="local-drink" size={20} color="#2196F3" />
                  <Text style={[styles.recommendationText, isDark && styles.textDark]}>
                    Günde en az 2.5 litre su tüketin, özellikle egzersiz öncesi ve sonrası
                  </Text>
                </View>
                
                <View style={[styles.recommendationItem, isDark && styles.cardDark]}>
                  <MaterialIcons name="fitness-center" size={20} color="#4CAF50" />
                  <Text style={[styles.recommendationText, isDark && styles.textDark]}>
                    {currentUser?.goal === 'weight_loss' && 'Haftada 3-4 kez kardiyovasküler egzersiz yapın'}
                    {currentUser?.goal === 'weight_gain' && 'Ağırlık antrenmanlarına odaklanın, haftada 4-5 kez'}
                    {currentUser?.goal === 'maintenance' && 'Dengeli bir egzersiz programı ile formunuzu koruyun'}
                    {currentUser?.goal === 'muscle_gain' && 'Yoğun ağırlık antrenmanları ve protein desteği alın'}
                  </Text>
                </View>
              </>
            )}
          </View>
          
          <TouchableOpacity style={styles.aiButton} onPress={() => Alert.alert('AI Önerileri', 'Gelişmiş AI önerileri yakında gelecek!')}>
            <MaterialIcons name="auto-awesome" size={20} color="white" />
            <Text style={styles.aiButtonText}>Detaylı Öneriler</Text>
          </TouchableOpacity>
        </View>

        {/* Menu */}
        <View style={[styles.menuCard, isDark && styles.cardDark]}>
          <TouchableOpacity style={[styles.menuItem, isDark && { borderBottomColor: colors.dark.border }]} onPress={handleShowPersonalInfo}>
            <View style={styles.menuItemLeft}>
              <MaterialIcons name="person" size={24} color="#4CAF50" />
              <Text style={[styles.menuItemText, isDark && styles.textDark]}>Kişisel Bilgiler</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={isDark ? colors.dark.text.secondary : "#999"} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }, isDark && { borderBottomColor: colors.dark.border }]} onPress={handleShowGoals}>
            <View style={styles.menuItemLeft}>
              <MaterialIcons name="flag" size={24} color="#FF9800" />
              <Text style={[styles.menuItemText, isDark && styles.textDark]}>Hedeflerim</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={isDark ? colors.dark.text.secondary : "#999"} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={[styles.logoutButton, isDark && { backgroundColor: '#D32F2F' }]} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#fff" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, isDark && styles.textSecondaryDark]}>EatWise v1.0</Text>
          <Text style={[styles.appCopyright, isDark && { color: colors.dark.text.secondary }]}>© 2024 EatWise</Text>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    padding: 40,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 6,
  },
  email: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
    fontWeight: '500',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  planText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  statsCard: {
    margin: 20,
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    ...shadows.md,
  },
  cardDark: {
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    color: colors.text.primary,
  },
  textDark: {
    color: colors.dark.text.primary,
  },
  textSecondaryDark: {
    color: colors.dark.text.secondary,
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
    fontWeight: '700',
    color: colors.primary[500],
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  settingsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 15,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    ...shadows.md,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  additionalInfo: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  metricsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  mainMetricContent: {
    marginLeft: 15,
    flex: 1,
  },
  mainMetricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  mainMetricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  metricBox: {
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  metricBoxLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  metricBoxValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  metricBoxUnit: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  macrosSection: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  macrosTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  modalContainerDark: {
    backgroundColor: colors.dark.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  modalHeaderDark: {
    backgroundColor: colors.dark.surface,
    borderBottomColor: colors.dark.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalContentDark: {
    backgroundColor: colors.dark.background,
  },
  // Goals Modal styles
  goalSection: {
    marginBottom: 30,
  },
  goalSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  currentGoalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    ...shadows.md,
  },
  goalInfo: {
    marginLeft: 15,
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
  },
  metricCard: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
    ...shadows.sm,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  editGoalsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    ...shadows.md,
  },
  editGoalsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  // Personal Info Modal styles
  infoSection: {
    marginBottom: 30,
  },
  infoSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  infoGrid: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    ...shadows.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoItemContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoItemLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  infoItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  editInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    ...shadows.md,
  },
  editInfoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  // AI Recommendations Styles
  aiCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    ...shadows.md,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginLeft: 12,
  },
  aiDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  aiRecommendations: {
    marginBottom: 20,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9C27B0',
    padding: 16,
    borderRadius: 12,
    ...shadows.md,
  },
  aiButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
