import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { DietPlan, DayPlan, MealPlan } from '../services/planService';
import { PlanDetailView } from '../components/PlanDetailView';

const { width } = Dimensions.get('window');

interface PlanDetailScreenProps {
  navigation: any;
  route: {
    params: {
      plan: DietPlan;
    };
  };
}

export default function PlanDetailScreen({ navigation, route }: PlanDetailScreenProps) {
  const { plan } = route.params;
  const { isDark } = useTheme();

  console.log('=== PLAN DETAIL SCREEN DEBUG ===');
  console.log('Plan received from route:', plan);
  console.log('Plan ID:', plan?.id);
  console.log('Plan user_id:', plan?.user_id);
  console.log('Plan name:', plan?.name);
  console.log('Plan is_active:', plan?.is_active);
  console.log('Plan weekly_plan keys:', plan?.weekly_plan ? Object.keys(plan.weekly_plan) : 'No weekly_plan');
  console.log('=== END PLAN DETAIL SCREEN DEBUG ===');

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleMealComplete = (mealId: string, completed: boolean) => {
    // Öğün tamamlama durumunu güncelle
    // Bu fonksiyon tracking sayfasıyla bağlantılı olacak
    console.log(`Meal ${mealId} completed: ${completed}`);
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <LinearGradient
        colors={isDark ? ['#2C3E50', '#34495E'] : ['#667eea', '#764ba2']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{plan.name}</Text>
            <Text style={styles.headerSubtitle}>
              {plan.is_active ? 'Aktif Plan' : 'Pasif Plan'}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            {plan.is_active && (
              <View style={styles.activeBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#2ECC71" />
              </View>
            )}
          </View>
        </View>

        {/* Plan Detail View */}
        <View style={styles.content}>
          <PlanDetailView plan={plan} onMealComplete={handleMealComplete} />
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
  },
  activeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});