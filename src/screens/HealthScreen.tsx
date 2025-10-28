import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { HealthDataService, HealthData } from '../services/healthDataService';
import { AuthService } from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme';

const { width } = Dimensions.get('window');

export default function HealthScreen() {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [todayData, setTodayData] = useState<HealthData | null>(null);
  const [weeklyData, setWeeklyData] = useState<HealthData[]>([]);
  const [selectedChart, setSelectedChart] = useState<'water' | 'steps' | 'sleep' | 'calories'>('water');

  // Input states
  const [waterInput, setWaterInput] = useState('');
  const [stepsInput, setStepsInput] = useState('');
  const [sleepInput, setSleepInput] = useState('');
  const [weightInput, setWeightInput] = useState('');

  const goals = HealthDataService.getDailyGoals();

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      const user = await AuthService.getCurrentUser();
      if (!user) return;

      // Bugünün verilerini al
      const today = await HealthDataService.getTodayHealthData(user.id);
      
      // Eğer bugün verisi yoksa, meals'dan kaloriyi hesapla
      if (today) {
        const calories = await HealthDataService.calculateTodayCalories(user.id);
        today.calories_consumed = calories;
        setTodayData(today);
      } else {
        const calories = await HealthDataService.calculateTodayCalories(user.id);
        setTodayData({
          user_id: user.id,
          date: new Date().toISOString().split('T')[0],
          calories_consumed: calories,
          water_intake: 0,
          steps: 0,
          sleep_hours: 0,
        });
      }

      // Haftalık verileri al
      const weekly = await HealthDataService.getWeeklyHealthData(user.id);
      setWeeklyData(weekly);
    } catch (error) {
      console.error('Sağlık verileri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWater = async () => {
    const amount = parseInt(waterInput);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Hata', 'Geçerli bir miktar girin');
      return;
    }

    try {
      const user = await AuthService.getCurrentUser();
      if (!user) return;

      await HealthDataService.updateWaterIntake(user.id, amount);
      setWaterInput('');
      await loadHealthData();
      Alert.alert('Başarılı', `${amount}ml su eklendi`);
    } catch (error) {
      Alert.alert('Hata', 'Su tüketimi eklenemedi');
    }
  };

  const handleUpdateSteps = async () => {
    const steps = parseInt(stepsInput);
    if (isNaN(steps) || steps < 0) {
      Alert.alert('Hata', 'Geçerli bir adım sayısı girin');
      return;
    }

    try {
      const user = await AuthService.getCurrentUser();
      if (!user) return;

      await HealthDataService.updateSteps(user.id, steps);
      setStepsInput('');
      await loadHealthData();
      Alert.alert('Başarılı', `${steps} adım kaydedildi`);
    } catch (error) {
      Alert.alert('Hata', 'Adım sayısı kaydedilemedi');
    }
  };

  const handleUpdateSleep = async () => {
    const hours = parseFloat(sleepInput);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      Alert.alert('Hata', 'Geçerli bir uyku süresi girin (0-24 saat)');
      return;
    }

    try {
      const user = await AuthService.getCurrentUser();
      if (!user) return;

      await HealthDataService.updateSleepHours(user.id, hours);
      setSleepInput('');
      await loadHealthData();
      Alert.alert('Başarılı', `${hours} saat uyku kaydedildi`);
    } catch (error) {
      Alert.alert('Hata', 'Uyku süresi kaydedilemedi');
    }
  };

  const handleUpdateWeight = async () => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Hata', 'Geçerli bir kilo girin');
      return;
    }

    try {
      const user = await AuthService.getCurrentUser();
      if (!user) return;

      await HealthDataService.updateWeight(user.id, weight);
      setWeightInput('');
      await loadHealthData();
      Alert.alert('Başarılı', `${weight} kg kaydedildi`);
    } catch (error) {
      Alert.alert('Hata', 'Kilo kaydedilemedi');
    }
  };

  const renderProgressCard = (
    icon: string,
    title: string,
    current: number,
    goal: number,
    unit: string,
    color: string
  ) => {
    const progress = HealthDataService.calculateProgress(current, goal);

    return (
      <View style={[styles.progressCard, { borderLeftColor: color }, isDark && styles.cardDark]}>
        <View style={styles.progressHeader}>
          <MaterialIcons name={icon as any} size={32} color={color} />
          <View style={styles.progressInfo}>
            <Text style={[styles.progressTitle, isDark && styles.textDark]}>{title}</Text>
            <Text style={[styles.progressValue, isDark && styles.textSecondaryDark]}>
              {current.toLocaleString()} / {goal.toLocaleString()} {unit}
            </Text>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: color }, isDark && { backgroundColor: colors.dark.primary }]} />
        </View>
        <Text style={[styles.progressPercent, isDark && styles.textSecondaryDark]}>{progress}%</Text>
      </View>
    );
  };

  const renderChart = () => {
    const chartData = HealthDataService.formatChartData(weeklyData, 
      selectedChart === 'water' ? 'water_intake' :
      selectedChart === 'steps' ? 'steps' :
      selectedChart === 'sleep' ? 'sleep_hours' :
      'calories_consumed'
    );

    // Her veri tipi için sabit maksimum değer (hedefin 1.5 katı)
    const maxValue = selectedChart === 'water' ? 3000 :      // 2000 * 1.5
                     selectedChart === 'steps' ? 15000 :     // 10000 * 1.5
                     selectedChart === 'sleep' ? 12 :        // 8 * 1.5
                     3000;                                   // 2000 * 1.5 (kalori)
    const chartHeight = 150;

    return (
      <View style={[styles.chartContainer, isDark && styles.cardDark]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, isDark && styles.textDark]}>Haftalık Grafik</Text>
          <View style={styles.chartTabs}>
            {(['water', 'steps', 'sleep', 'calories'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.chartTab, selectedChart === type && styles.chartTabActive]}
                onPress={() => setSelectedChart(type)}
              >
                <Text style={[styles.chartTabText, selectedChart === type && styles.chartTabTextActive, isDark && selectedChart !== type && styles.textSecondaryDark]}>
                  {type === 'water' ? '💧' : type === 'steps' ? '👟' : type === 'sleep' ? '😴' : '🔥'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.chart}>
          {chartData.map((item, index) => (
            <View key={index} style={styles.chartBar}>
              <View style={styles.chartBarContainer}>
                <View
                  style={[
                    styles.chartBarFill,
                    {
                      height: (item.value / maxValue) * chartHeight,
                      backgroundColor: selectedChart === 'water' ? '#2196F3' :
                                     selectedChart === 'steps' ? '#4CAF50' :
                                     selectedChart === 'sleep' ? '#9C27B0' :
                                     '#FF9800',
                    },
                  ]}
                />
              </View>
              <Text style={[styles.chartLabel, isDark && styles.textSecondaryDark]}>{item.day}</Text>
              <Text style={[styles.chartValue, isDark && styles.textDark]}>
                {selectedChart === 'sleep' ? item.value.toFixed(1) : Math.round(item.value)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={isDark ? ['#1E3A8A', '#1E40AF', '#2563EB'] : ['#10B981', '#059669'] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.title}>Sağlık Takibi</Text>
        <Text style={styles.subtitle}>Günlük hedeflerinizi takip edin</Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Progress Cards */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Bugünün Özeti</Text>
          
          {renderProgressCard(
            'local-drink',
            'Su Tüketimi',
            todayData?.water_intake || 0,
            goals.water,
            'ml',
            '#2196F3'
          )}

          {renderProgressCard(
            'directions-walk',
            'Adım Sayısı',
            todayData?.steps || 0,
            goals.steps,
            'adım',
            '#4CAF50'
          )}

          {renderProgressCard(
            'bedtime',
            'Uyku',
            todayData?.sleep_hours || 0,
            goals.sleep,
            'saat',
            '#9C27B0'
          )}

          {renderProgressCard(
            'local-fire-department',
            'Kalori',
            todayData?.calories_consumed || 0,
            goals.calories,
            'kcal',
            '#FF9800'
          )}
        </View>

        {/* Data Entry */}
        <View style={[styles.section, isDark && { backgroundColor: colors.dark.background }]}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Veri Girişi</Text>

          {/* Water Input */}
          <View style={[styles.inputCard, isDark && styles.cardDark]}>
            <MaterialIcons name="local-drink" size={24} color={isDark ? colors.dark.info : "#2196F3"} />
            <TextInput
              style={[styles.input, isDark && { color: colors.dark.text.primary, backgroundColor: colors.dark.surfaceElevated, borderColor: colors.dark.border }]}
              placeholder="Su ekle (ml)"
              placeholderTextColor={isDark ? colors.dark.text.tertiary : '#999'}
              keyboardType="numeric"
              value={waterInput}
              onChangeText={setWaterInput}
            />
            <TouchableOpacity style={[styles.addButton, { backgroundColor: isDark ? colors.dark.info : '#2196F3' }]} onPress={handleAddWater}>
              <MaterialIcons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Steps Input */}
          <View style={[styles.inputCard, isDark && styles.cardDark]}>
            <MaterialIcons name="directions-walk" size={24} color={isDark ? colors.dark.success : "#4CAF50"} />
            <TextInput
              style={[styles.input, isDark && { color: colors.dark.text.primary, backgroundColor: colors.dark.surfaceElevated, borderColor: colors.dark.border }]}
              placeholder="Adım sayısı"
              placeholderTextColor={isDark ? colors.dark.text.tertiary : '#999'}
              keyboardType="numeric"
              value={stepsInput}
              onChangeText={setStepsInput}
            />
            <TouchableOpacity style={[styles.addButton, { backgroundColor: isDark ? colors.dark.success : '#4CAF50' }]} onPress={handleUpdateSteps}>
              <MaterialIcons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Sleep Input */}
          <View style={[styles.inputCard, isDark && styles.cardDark]}>
            <MaterialIcons name="bedtime" size={24} color={isDark ? colors.dark.secondary : "#9C27B0"} />
            <TextInput
              style={[styles.input, isDark && { color: colors.dark.text.primary, backgroundColor: colors.dark.surfaceElevated, borderColor: colors.dark.border }]}
              placeholder="Uyku süresi (saat)"
              placeholderTextColor={isDark ? colors.dark.text.tertiary : '#999'}
              keyboardType="numeric"
              value={sleepInput}
              onChangeText={setSleepInput}
            />
            <TouchableOpacity style={[styles.addButton, { backgroundColor: isDark ? colors.dark.secondary : '#9C27B0' }]} onPress={handleUpdateSleep}>
              <MaterialIcons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Weight Input */}
          <View style={[styles.inputCard, isDark && styles.cardDark]}>
            <MaterialIcons name="monitor-weight" size={24} color={isDark ? colors.dark.error : "#FF5722"} />
            <TextInput
              style={[styles.input, isDark && { color: colors.dark.text.primary, backgroundColor: colors.dark.surfaceElevated, borderColor: colors.dark.border }]}
              placeholder="Kilo (kg)"
              placeholderTextColor={isDark ? colors.dark.text.tertiary : '#999'}
              keyboardType="numeric"
              value={weightInput}
              onChangeText={setWeightInput}
            />
            <TouchableOpacity style={[styles.addButton, { backgroundColor: isDark ? colors.dark.error : '#FF5722' }]} onPress={handleUpdateWeight}>
              <MaterialIcons name="check" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        {/* Weekly Chart */}
        {renderChart()}

        {/* Weekly Stats */}
        <View style={[styles.section, isDark && { backgroundColor: colors.dark.background }]}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Haftalık Ortalama</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, isDark && styles.cardDark]}>
              <Text style={[styles.statValue, isDark && { color: colors.dark.primary }]}>
                {HealthDataService.calculateWeeklyAverage(weeklyData, 'water_intake')}ml
              </Text>
              <Text style={[styles.statLabel, isDark && styles.textSecondaryDark]}>Su</Text>
            </View>
            <View style={[styles.statCard, isDark && styles.cardDark]}>
              <Text style={[styles.statValue, isDark && { color: colors.dark.primary }]}>
                {HealthDataService.calculateWeeklyAverage(weeklyData, 'steps')}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.textSecondaryDark]}>Adım</Text>
            </View>
            <View style={[styles.statCard, isDark && styles.cardDark]}>
              <Text style={[styles.statValue, isDark && { color: colors.dark.primary }]}>
                {HealthDataService.calculateWeeklyAverage(weeklyData, 'sleep_hours').toFixed(1)}h
              </Text>
              <Text style={[styles.statLabel, isDark && styles.textSecondaryDark]}>Uyku</Text>
            </View>
            <View style={[styles.statCard, isDark && styles.cardDark]}>
              <Text style={[styles.statValue, isDark && { color: colors.dark.primary }]}>
                {HealthDataService.calculateWeeklyAverage(weeklyData, 'calories_consumed')}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.textSecondaryDark]}>Kalori</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
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
  header: {
    padding: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '500',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  textDark: {
    color: colors.dark.text.primary,
  },
  textSecondaryDark: {
    color: colors.dark.text.secondary,
  },
  cardDark: {
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressInfo: {
    marginLeft: 15,
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  progressValue: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  chartTabs: {
    flexDirection: 'row',
    gap: 5,
  },
  chartTab: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartTabActive: {
    backgroundColor: '#4CAF50',
  },
  chartTabText: {
    fontSize: 18,
  },
  chartTabTextActive: {
    fontSize: 18,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    paddingTop: 20,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarContainer: {
    width: '80%',
    height: 150,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBarFill: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 2,
  },
  chartLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
  },
  chartValue: {
    fontSize: 9,
    color: '#999',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
});
