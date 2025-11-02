import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthService } from '../services/authService';
import { UserProfile } from '../types/types';
import { calculateAllHealthMetrics, HealthMetrics } from '../utils/healthCalculations';

interface ProfileEditScreenProps {
  user: UserProfile | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function ProfileEditScreen({ user, onSave, onCancel }: ProfileEditScreenProps) {
  const [loading, setLoading] = useState(false);
  const [calculatedMetrics, setCalculatedMetrics] = useState<HealthMetrics | null>(null);
  
  // Form state
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [weight, setWeight] = useState(user?.weight?.toString() || '');
  const [height, setHeight] = useState(user?.height?.toString() || '');
  const [gender, setGender] = useState<'male' | 'female'>(user?.gender || 'male');
  const [activityLevel, setActivityLevel] = useState<'low' | 'moderate' | 'high'>(
    user?.activityLevel || 'moderate'
  );
  const [goal, setGoal] = useState<'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain'>(
    user?.goal || 'maintenance'
  );

  // Metrikleri hesapla
  useEffect(() => {
    if (age && weight && height && gender && activityLevel && goal) {
      try {
        const metrics = calculateAllHealthMetrics({
          age: parseInt(age),
          weight: parseFloat(weight),
          height: parseFloat(height),
          gender,
          activityLevel,
          goal
        });
        setCalculatedMetrics(metrics);
      } catch (error) {
        console.error('Metrik hesaplama hatası:', error);
      }
    }
  }, [age, weight, height, gender, activityLevel, goal]);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen adınızı girin');
      return false;
    }
    
    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum) || ageNum < 10 || ageNum > 120) {
      Alert.alert('Hata', 'Lütfen geçerli bir yaş girin (10-120)');
      return false;
    }
    
    const weightNum = parseFloat(weight);
    if (!weight || isNaN(weightNum) || weightNum < 30 || weightNum > 300) {
      Alert.alert('Hata', 'Lütfen geçerli bir kilo girin (30-300 kg)');
      return false;
    }
    
    const heightNum = parseFloat(height);
    if (!height || isNaN(heightNum) || heightNum < 100 || heightNum > 250) {
      Alert.alert('Hata', 'Lütfen geçerli bir boy girin (100-250 cm)');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !user) return;
    
    setLoading(true);
    try {
      await AuthService.updateProfile(user.uid, {
        name,
        age: parseInt(age),
        weight: parseFloat(weight),
        height: parseFloat(height),
        gender,
        activityLevel,
        goal
      });
      
      Alert.alert('Başarılı', 'Profiliniz güncellendi!', [
        { text: 'Tamam', onPress: onSave }
      ]);
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Profil güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const goalOptions = [
    { value: 'weight_loss', label: 'Kilo Verme', icon: '📉', color: '#FF5722' },
    { value: 'maintenance', label: 'Koruma', icon: '⚖️', color: '#2196F3' },
    { value: 'weight_gain', label: 'Kilo Alma', icon: '📈', color: '#FF9800' },
    { value: 'muscle_gain', label: 'Kas Yapma', icon: '💪', color: '#9C27B0' }
  ];

  const activityOptions = [
    { value: 'low', label: 'Düşük', description: 'Az veya hiç egzersiz' },
    { value: 'moderate', label: 'Orta', description: 'Haftada 3-5 gün egzersiz' },
    { value: 'high', label: 'Yüksek', description: 'Haftada 6-7 gün egzersiz' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profili Düzenle</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <MaterialIcons name="check" size={24} color="#4CAF50" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Temel Bilgiler */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ad Soyad</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Adınızı girin"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, styles.inputHalf]}>
                <Text style={styles.label}>Yaş</Text>
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  placeholder="25"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={[styles.inputGroup, styles.inputHalf]}>
                <Text style={styles.label}>Cinsiyet</Text>
                <View style={styles.genderButtons}>
                  <TouchableOpacity
                    style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                    onPress={() => setGender('male')}
                  >
                    <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextActive]}>
                      Erkek
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                    onPress={() => setGender('female')}
                  >
                    <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextActive]}>
                      Kadın
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, styles.inputHalf]}>
                <Text style={styles.label}>Kilo (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="75"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={[styles.inputGroup, styles.inputHalf]}>
                <Text style={styles.label}>Boy (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="175"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>

          {/* Aktivite Seviyesi */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aktivite Seviyesi</Text>
            {activityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  activityLevel === option.value && styles.optionCardActive
                ]}
                onPress={() => setActivityLevel(option.value as any)}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, activityLevel === option.value && styles.optionLabelActive]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                {activityLevel === option.value && (
                  <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Hedef */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hedefiniz</Text>
            <View style={styles.goalGrid}>
              {goalOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.goalCard,
                    goal === option.value && { borderColor: option.color, borderWidth: 2 }
                  ]}
                  onPress={() => setGoal(option.value as any)}
                >
                  <Text style={styles.goalIcon}>{option.icon}</Text>
                  <Text style={[styles.goalLabel, { color: option.color }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Hesaplanan Metrikler */}
          {calculatedMetrics && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hesaplanan Değerler</Text>
              
              <View style={styles.metricsCard}>
                <View style={styles.metricRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>BMR</Text>
                    <Text style={styles.metricValue}>{calculatedMetrics.bmr}</Text>
                    <Text style={styles.metricUnit}>kcal/gün</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>TDEE</Text>
                    <Text style={styles.metricValue}>{calculatedMetrics.tdee}</Text>
                    <Text style={styles.metricUnit}>kcal/gün</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.highlightMetric}>
                  <MaterialIcons name="local-fire-department" size={32} color="#FF5722" />
                  <View style={styles.highlightContent}>
                    <Text style={styles.highlightLabel}>Günlük Kalori Hedefi</Text>
                    <Text style={styles.highlightValue}>{calculatedMetrics.dailyCalorieGoal} kcal</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.metricRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>BMI</Text>
                    <Text style={styles.metricValue}>{calculatedMetrics.bmi}</Text>
                    <Text style={styles.metricUnit}>{calculatedMetrics.bmiCategory}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.macroTitle}>Günlük Makro Hedefleri</Text>
                <View style={styles.metricRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Protein</Text>
                    <Text style={styles.metricValue}>{calculatedMetrics.proteinGoal}g</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Karbonhidrat</Text>
                    <Text style={styles.metricValue}>{calculatedMetrics.carbsGoal}g</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Yağ</Text>
                    <Text style={styles.metricValue}>{calculatedMetrics.fatGoal}g</Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoBox}>
                <MaterialIcons name="info" size={20} color="#2196F3" />
                <Text style={styles.infoText}>
                  BMR: Dinlenme halinde yaktığınız kalori{'\n'}
                  TDEE: Günlük toplam enerji harcamanız{'\n'}
                  Kalori hedefi hedefinize göre ayarlanmıştır
                </Text>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    padding: 5,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputHalf: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  genderButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  genderButtonTextActive: {
    color: 'white',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  optionCardActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8f4',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  optionLabelActive: {
    color: '#4CAF50',
  },
  optionDescription: {
    fontSize: 13,
    color: '#666',
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  goalCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  goalIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  metricsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  metricUnit: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
  highlightMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 8,
  },
  highlightContent: {
    marginLeft: 15,
    flex: 1,
  },
  highlightLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  highlightValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  macroTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1976D2',
    marginLeft: 10,
    lineHeight: 18,
  },
});
