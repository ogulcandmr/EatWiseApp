import React, { useState, useEffect } from 'react';
import { View, Alert, Dimensions, ScrollView, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../hooks/useAuth';
import { usePlans } from '../hooks/usePlans';
import { PlanService } from '../services/planService';
import { MealService } from '../services/mealService';
import { AuthService } from '../services/authService';
import { DietPlan, WeeklyPlan, DayPlan, MealPlan } from '../services/planService';
import PlanEditHeader from '../components/PlanEdit/PlanEditHeader';
import PlanInfoForm from '../components/PlanEdit/PlanInfoForm';
import MealPlanManager from '../components/PlanEdit/MealPlanManager';
import styles from '../components/PlanEdit/PlanEditStyles';

interface PlanEditScreenProps {
  planId?: string;
  plan?: DietPlan;
  recipeData?: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients?: string[];
    instructions?: string[];
  };
  selectedRecipe?: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients?: string[];
    instructions?: string[];
  };
  selectedDay?: keyof DietPlan['weekly_plan'];
  selectedMealType?: keyof DayPlan;
  onNavigateBack?: () => void;
  onNavigateToRecipe?: (params: any) => void;
}

const GOAL_OPTIONS = [
  { value: 'weight_loss', label: 'Kilo Verme' },
  { value: 'weight_gain', label: 'Kilo Alma' },
  { value: 'maintenance', label: 'Kilo Koruma' },
  { value: 'muscle_gain', label: 'Kas Kazanma' },
] as const;

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Kahvaltı', icon: 'sunny', color: '#F39C12' },
  { value: 'lunch', label: 'Öğle Yemeği', icon: 'restaurant', color: '#E74C3C' },
  { value: 'dinner', label: 'Akşam Yemeği', icon: 'moon', color: '#8E44AD' },
] as const;

export default function PlanEditScreen(props: PlanEditScreenProps) {
  const { user } = useAuth();
  const { createPlan, updatePlan } = usePlans();
  const { setCurrentPlan, currentPlan } = useAppStore();

  // State
  const [planName, setPlanName] = useState<string>('');
  const [goal, setGoal] = useState<string>('maintenance');
  const [dailyCalories, setDailyCalories] = useState<string>('2000');
  const [dailyProtein, setDailyProtein] = useState<string>('150');
  const [dailyCarbs, setDailyCarbs] = useState<string>('250');
  const [dailyFat, setDailyFat] = useState<string>('67');
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>({});
  const [selectedDay, setSelectedDay] = useState<keyof DietPlan['weekly_plan']>('pazartesi');
  const [selectedMealType, setSelectedMealType] = useState<keyof DayPlan>('breakfast');
  const [existingPlan, setExistingPlan] = useState<DietPlan | null>(null);
  const [isDark] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
          const profile = await AuthService.getUserProfile(currentUser.id);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Kullanıcı profili yüklenemedi:', error);
      }
    };

    loadUserProfile();
  }, []);

  // Calculate AI values based on goal and user profile
  const calculateAIValues = () => {
    if (!userProfile) return;

    const weight = userProfile.weight || 70;
    const height = userProfile.height || 170;
    const age = userProfile.age || 25;
    const gender = userProfile.gender || 'male';
    const activityLevel = userProfile.activityLevel || 'moderate';

    // BMR calculation (Mifflin-St Jeor formula)
    let bmr: number;
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    // Activity level multipliers
    const activityMultipliers = {
      low: 1.2,
      moderate: 1.55,
      high: 1.725
    };

    const dailyCaloriesBase = Math.round(bmr * (activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.55));

    // Adjust calories based on goal
    let adjustedCalories: number;
    switch (goal) {
      case 'weight_loss':
        adjustedCalories = Math.round(dailyCaloriesBase * 0.8); // 20% deficit
        break;
      case 'weight_gain':
        adjustedCalories = Math.round(dailyCaloriesBase * 1.2); // 20% surplus
        break;
      case 'muscle_gain':
        adjustedCalories = Math.round(dailyCaloriesBase * 1.15); // 15% surplus
        break;
      default: // maintenance
        adjustedCalories = dailyCaloriesBase;
        break;
    }

    // Calculate macros
    const protein = Math.round(adjustedCalories * 0.25 / 4); // 25% protein
    const carbs = Math.round(adjustedCalories * 0.45 / 4); // 45% carbs
    const fat = Math.round(adjustedCalories * 0.30 / 9); // 30% fat

    // Update state
    setDailyCalories(adjustedCalories.toString());
    setDailyProtein(protein.toString());
    setDailyCarbs(carbs.toString());
    setDailyFat(fat.toString());
  };

  // Initialize plan data
  useEffect(() => {
    const initializePlan = async () => {
      const { plan, planId, recipeData, selectedRecipe, selectedDay: routeDay, selectedMealType: routeMealType } = props;

      if (plan) {
        // Use existing plan object
        setExistingPlan(plan);
        setPlanName(plan.name);
        setGoal(plan.goal);
        setDailyCalories(plan.daily_calories.toString());
        setDailyProtein(plan.daily_protein.toString());
        setDailyCarbs(plan.daily_carbs.toString());
        setDailyFat(plan.daily_fat.toString());
        setWeeklyPlan(plan.weekly_plan);
      } else if (planId) {
        // Edit existing plan by loading from database
        try {
          const loadedPlan = await PlanService.getPlanById(planId);
          if (loadedPlan) {
            setExistingPlan(loadedPlan);
            setPlanName(loadedPlan.name);
            setGoal(loadedPlan.goal);
            setDailyCalories(loadedPlan.daily_calories.toString());
            setDailyProtein(loadedPlan.daily_protein.toString());
            setDailyCarbs(loadedPlan.daily_carbs.toString());
            setDailyFat(loadedPlan.daily_fat.toString());
            setWeeklyPlan(loadedPlan.weekly_plan);
          }
        } catch (error) {
          console.error('Plan yükleme hatası:', error);
        }
      } else {
        // Create new plan
        const initialWeeklyPlan: WeeklyPlan = {};
        const days = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi', 'pazar'];
        days.forEach(day => {
          initialWeeklyPlan[day] = {
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: [],
          };
        });
        setWeeklyPlan(initialWeeklyPlan);
      }

      // Set selected day and meal type from route params if provided
      if (routeDay && routeMealType) {
        setSelectedDay(routeDay);
        setSelectedMealType(routeMealType);
      }
    };

    initializePlan();
  }, [props.plan, props.planId, props.recipeData, props.selectedRecipe, props.selectedDay, props.selectedMealType]);

  // Meal management functions
  const addMeal = () => {
    const newMeal: MealPlan = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Yeni Öğün',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    setWeeklyPlan(prev => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [selectedMealType]: [...(prev[selectedDay]?.[selectedMealType] || []), newMeal],
      },
    }));
  };

  const updateMeal = (mealIndex: number, field: keyof MealPlan, value: string | number) => {
    setWeeklyPlan(prev => {
      const updatedPlan = { ...prev };
      if (updatedPlan[selectedDay] && updatedPlan[selectedDay][selectedMealType]) {
        const updatedMeals = [...updatedPlan[selectedDay][selectedMealType]];
        if (updatedMeals[mealIndex]) {
          updatedMeals[mealIndex] = {
            ...updatedMeals[mealIndex],
            [field]: value,
          };
          updatedPlan[selectedDay][selectedMealType] = updatedMeals;
        }
      }
      return updatedPlan;
    });
  };

  const deleteMeal = (mealIndex: number) => {
    setWeeklyPlan(prev => {
      const updatedPlan = { ...prev };
      if (updatedPlan[selectedDay] && updatedPlan[selectedDay][selectedMealType]) {
        const updatedMeals = [...updatedPlan[selectedDay][selectedMealType]];
        updatedMeals.splice(mealIndex, 1);
        updatedPlan[selectedDay][selectedMealType] = updatedMeals;
      }
      return updatedPlan;
    });
  };

  // Save plan
  const savePlan = async () => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    if (!planName.trim()) {
      Alert.alert('Hata', 'Plan adı gereklidir');
      return;
    }

    try {
      const planData: Omit<DietPlan, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        name: planName,
        goal: goal as 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain',
        daily_calories: parseInt(dailyCalories) || 2000,
        daily_protein: parseInt(dailyProtein) || 150,
        daily_carbs: parseInt(dailyCarbs) || 250,
        daily_fat: parseInt(dailyFat) || 67,
        weekly_plan: weeklyPlan,
        is_active: true,
      };

      if (existingPlan?.id) {
        await updatePlan(existingPlan.id, planData);
      } else {
        await createPlan(planData);
      }

      Alert.alert('Başarılı', 'Plan kaydedildi', [
        { text: 'Tamam', onPress: () => props.onNavigateBack?.() }
      ]);
    } catch (error) {
      console.error('Plan kaydetme hatası:', error);
      Alert.alert('Hata', 'Plan kaydedilemedi');
    }
  };

  // Get current meals for selected day and meal type
  const currentMeals = weeklyPlan[selectedDay]?.[selectedMealType] || [];

  // Generate a temporary UUID for new plans
  const generateTempUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Update currentPlan whenever plan data changes
  useEffect(() => {
    if (user?.id) {
      const planData: DietPlan = {
        id: existingPlan?.id || generateTempUUID(),
        user_id: user.id,
        name: planName,
        goal: goal as 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain',
        daily_calories: parseInt(dailyCalories) || 2000,
        daily_protein: parseInt(dailyProtein) || 150,
        daily_carbs: parseInt(dailyCarbs) || 250,
        daily_fat: parseInt(dailyFat) || 67,
        weekly_plan: weeklyPlan,
        is_active: true,
        created_at: existingPlan?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setCurrentPlan(planData);
    }
  }, [planName, goal, dailyCalories, dailyProtein, dailyCarbs, dailyFat, weeklyPlan, user?.id, existingPlan, setCurrentPlan]);

  // Auto-save plan when user navigates to recipe creation
  const autoSavePlan = async () => {
    if (!user?.id || !planName.trim()) return;

    try {
      const planData: DietPlan = {
        user_id: user.id,
        name: planName,
        goal: goal as 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain',
        daily_calories: parseInt(dailyCalories) || 2000,
        daily_protein: parseInt(dailyProtein) || 150,
        daily_carbs: parseInt(dailyCarbs) || 250,
        daily_fat: parseInt(dailyFat) || 67,
        weekly_plan: weeklyPlan,
        is_active: true,
        created_at: existingPlan?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existingPlan?.id && !existingPlan.id.startsWith('temp_') && existingPlan.id.includes('-')) {
        // Gerçek bir plan ID'si varsa güncelle
        await updatePlan(existingPlan.id, { ...planData, id: existingPlan.id });
      } else {
        // Yeni plan oluştur
        const newPlan = await createPlan(planData);
        // Update existingPlan with the newly created plan
        if (newPlan) {
          setExistingPlan(newPlan);
        }
      }
    } catch (error) {
      console.error('Auto-save hatası:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}>
      <PlanEditHeader
        isDark={isDark}
        planName={planName}
        onNavigateBack={props.onNavigateBack}
        styles={styles}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <PlanInfoForm
          isDark={isDark}
          planName={planName}
          setPlanName={setPlanName}
          goal={goal}
          setGoal={setGoal}
          dailyCalories={dailyCalories}
          setDailyCalories={setDailyCalories}
          dailyProtein={dailyProtein}
          setDailyProtein={setDailyProtein}
          dailyCarbs={dailyCarbs}
          setDailyCarbs={setDailyCarbs}
          dailyFat={dailyFat}
          setDailyFat={setDailyFat}
          goalOptions={GOAL_OPTIONS}
          onCalculateAI={calculateAIValues}
          styles={styles}
        />

        <MealPlanManager
          isDark={isDark}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          selectedMealType={selectedMealType}
          setSelectedMealType={setSelectedMealType}
          weeklyPlan={weeklyPlan}
          currentMeals={currentMeals}
          addMeal={addMeal}
          updateMeal={updateMeal}
          deleteMeal={deleteMeal}
          onNavigateToRecipe={props.onNavigateToRecipe}
          autoSavePlan={autoSavePlan}
          styles={styles}
        />
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionButtons, { paddingBottom: 20, backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)' }]}
          onPress={() => props.onNavigateBack?.()}
        >
          <Text style={[styles.cancelButtonText, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
            İptal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={savePlan}>
          <LinearGradient
            colors={['#667EEA', '#764BA2']}
            style={styles.saveButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="checkmark" size={20} color="white" />
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}