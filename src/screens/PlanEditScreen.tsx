import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePlans } from '../hooks/usePlans';
import { DietPlan, MealPlan, DayPlan } from '../services/planService';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { MealService } from '../services/mealService';
import { AuthService } from '../services/authService';
import { useAppStore } from '../store/useAppStore';

const { width } = Dimensions.get('window');

interface RouteParams {
  plan?: DietPlan;
  recipeData?: {
    day: string;
    mealType: string;
    name: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  selectedRecipe?: {
    name: string;
    description?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients?: string[];
    steps?: string[];
    selectedDay?: string;
    selectedMealType?: string;
  };
  // Plan state preservation from IngredientsToRecipeScreen
  planName?: string;
  goal?: string;
  dailyCalories?: number;
  dailyProtein?: number;
  dailyCarbs?: number;
  dailyFat?: number;
  weeklyPlan?: any;
  existingPlan?: any;
}

interface Props {
  navigation: any;
  route: {
    params?: RouteParams;
  };
}

const GOAL_OPTIONS = [
  { value: 'weight_loss', label: 'Kilo Verme', icon: 'trending-down', color: '#E74C3C' },
  { value: 'weight_gain', label: 'Kilo Alma', icon: 'trending-up', color: '#2ECC71' },
  { value: 'maintenance', label: 'Koruma', icon: 'remove', color: '#3498DB' },
  { value: 'muscle_gain', label: 'Kas Kazanımı', icon: 'fitness', color: '#9B59B6' },
] as const;

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Kahvaltı', icon: 'sunny', color: '#F39C12' },
  { value: 'lunch', label: 'Öğle Yemeği', icon: 'restaurant', color: '#E74C3C' },
  { value: 'dinner', label: 'Akşam Yemeği', icon: 'moon', color: '#8E44AD' },
] as const;

export default function PlanEditScreen({ navigation, route }: Props) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { createPlan, updatePlan, generateAIPlan, loading, activePlan: currentActivePlan } = usePlans();
  
  // Global store
  const { 
    currentPlan,
    activePlan,
    createNewPlan, 
    setCurrentPlan,
    setActivePlan,
    addRecipeToMeal, 
    updatePlanMeal, 
    removeMealFromPlan,
    clearCurrentPlan,
    setEditingPlan,
    updateExistingPlan,
    syncPlanToMeals
  } = useAppStore();

  const existingPlan = route.params?.plan;
  const isEditing = !!existingPlan;

  // Form state - global store'dan gelecek
  const [planName, setPlanName] = useState(currentPlan?.name || existingPlan?.name || '');
  const [goal, setGoal] = useState<DietPlan['goal']>(currentPlan?.goal || existingPlan?.goal || 'maintenance');
  const [dailyCalories, setDailyCalories] = useState(currentPlan?.daily_calories?.toString() || existingPlan?.daily_calories?.toString() || '');
  const [dailyProtein, setDailyProtein] = useState(currentPlan?.daily_protein?.toString() || existingPlan?.daily_protein?.toString() || '');
  const [dailyCarbs, setDailyCarbs] = useState(currentPlan?.daily_carbs?.toString() || existingPlan?.daily_carbs?.toString() || '');
  const [dailyFat, setDailyFat] = useState(currentPlan?.daily_fat?.toString() || existingPlan?.daily_fat?.toString() || '');
  // Güvenli weekly_plan başlatma
   const getInitialWeeklyPlan = (): DietPlan['weekly_plan'] => {
     const defaultDayPlan = { breakfast: [], lunch: [], dinner: [], snacks: [] };
     
     if (!existingPlan?.weekly_plan || typeof existingPlan.weekly_plan !== 'object') {
       return {
         pazartesi: { ...defaultDayPlan },
         sali: { ...defaultDayPlan },
         carsamba: { ...defaultDayPlan },
         persembe: { ...defaultDayPlan },
         cuma: { ...defaultDayPlan },
         cumartesi: { ...defaultDayPlan },
         pazar: { ...defaultDayPlan },
       };
     }

     // Mevcut planı güvenli şekilde kopyala
     const safePlan = existingPlan.weekly_plan;
     return {
       pazartesi: {
         breakfast: Array.isArray(safePlan.pazartesi?.breakfast) ? safePlan.pazartesi.breakfast : [],
         lunch: Array.isArray(safePlan.pazartesi?.lunch) ? safePlan.pazartesi.lunch : [],
         dinner: Array.isArray(safePlan.pazartesi?.dinner) ? safePlan.pazartesi.dinner : [],
         snacks: Array.isArray(safePlan.pazartesi?.snacks) ? safePlan.pazartesi.snacks : [],
       },
       sali: {
         breakfast: Array.isArray(safePlan.sali?.breakfast) ? safePlan.sali.breakfast : [],
         lunch: Array.isArray(safePlan.sali?.lunch) ? safePlan.sali.lunch : [],
         dinner: Array.isArray(safePlan.sali?.dinner) ? safePlan.sali.dinner : [],
         snacks: Array.isArray(safePlan.sali?.snacks) ? safePlan.sali.snacks : [],
       },
       carsamba: {
         breakfast: Array.isArray(safePlan.carsamba?.breakfast) ? safePlan.carsamba.breakfast : [],
         lunch: Array.isArray(safePlan.carsamba?.lunch) ? safePlan.carsamba.lunch : [],
         dinner: Array.isArray(safePlan.carsamba?.dinner) ? safePlan.carsamba.dinner : [],
         snacks: Array.isArray(safePlan.carsamba?.snacks) ? safePlan.carsamba.snacks : [],
       },
       persembe: {
         breakfast: Array.isArray(safePlan.persembe?.breakfast) ? safePlan.persembe.breakfast : [],
         lunch: Array.isArray(safePlan.persembe?.lunch) ? safePlan.persembe.lunch : [],
         dinner: Array.isArray(safePlan.persembe?.dinner) ? safePlan.persembe.dinner : [],
         snacks: Array.isArray(safePlan.persembe?.snacks) ? safePlan.persembe.snacks : [],
       },
       cuma: {
         breakfast: Array.isArray(safePlan.cuma?.breakfast) ? safePlan.cuma.breakfast : [],
         lunch: Array.isArray(safePlan.cuma?.lunch) ? safePlan.cuma.lunch : [],
         dinner: Array.isArray(safePlan.cuma?.dinner) ? safePlan.cuma.dinner : [],
         snacks: Array.isArray(safePlan.cuma?.snacks) ? safePlan.cuma.snacks : [],
       },
       cumartesi: {
         breakfast: Array.isArray(safePlan.cumartesi?.breakfast) ? safePlan.cumartesi.breakfast : [],
         lunch: Array.isArray(safePlan.cumartesi?.lunch) ? safePlan.cumartesi.lunch : [],
         dinner: Array.isArray(safePlan.cumartesi?.dinner) ? safePlan.cumartesi.dinner : [],
         snacks: Array.isArray(safePlan.cumartesi?.snacks) ? safePlan.cumartesi.snacks : [],
       },
       pazar: {
         breakfast: Array.isArray(safePlan.pazar?.breakfast) ? safePlan.pazar.breakfast : [],
         lunch: Array.isArray(safePlan.pazar?.lunch) ? safePlan.pazar.lunch : [],
         dinner: Array.isArray(safePlan.pazar?.dinner) ? safePlan.pazar.dinner : [],
         snacks: Array.isArray(safePlan.pazar?.snacks) ? safePlan.pazar.snacks : [],
       },
     };
   };

  // Global store'dan weeklyPlan'i al, yoksa getInitialWeeklyPlan() kullan
  const [weeklyPlan, setWeeklyPlan] = useState<DietPlan['weekly_plan']>(
    currentPlan?.weekly_plan || getInitialWeeklyPlan()
  );

  const [selectedDay, setSelectedDay] = useState<keyof DietPlan['weekly_plan']>('pazartesi');
  const [selectedMealType, setSelectedMealType] = useState<keyof DayPlan>('breakfast');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // Seçili öğün tipinin verilerini al
  const selectedMealTypeData = MEAL_TYPES.find(type => type.value === selectedMealType);

  // currentPlan değiştiğinde weeklyPlan'i senkronize et
  useEffect(() => {
    if (currentPlan?.weekly_plan) {
      setWeeklyPlan(currentPlan.weekly_plan);
    }
  }, [currentPlan]);

  // Tarif verilerini işle
  useEffect(() => {
    const recipeData = route.params?.recipeData;
    if (recipeData) {
      const handleAddRecipeData = async () => {
        try {
          const { day, mealType, name, description, calories, protein, carbs, fat } = recipeData;
          
          // Yeni meal objesi oluştur
          const newMeal: MealPlan = {
            id: Date.now().toString(), // Geçici ID
            name,
            description,
            calories,
            protein,
            carbs,
            fat,
          };

          // Weekly plan'ı güncelle
          setWeeklyPlan(prevPlan => {
            const updatedPlan = { ...prevPlan };
            const dayKey = day as keyof DietPlan['weekly_plan'];
            const mealTypeKey = mealType as keyof DayPlan;
            
            if (updatedPlan[dayKey] && updatedPlan[dayKey][mealTypeKey]) {
              updatedPlan[dayKey] = {
                ...updatedPlan[dayKey],
                [mealTypeKey]: [...updatedPlan[dayKey][mealTypeKey], newMeal]
              };
            }
            
            return updatedPlan;
          });

          // Seçili gün ve öğün tipini güncelle
          setSelectedDay(day as keyof DietPlan['weekly_plan']);
          setSelectedMealType(mealType as keyof DayPlan);

          // Öğünü MealService ile Öğünler sayfasına da kaydet (sadece bugünse)
          const user = await AuthService.getCurrentUser();
          if (user) {
            // Sadece bugünün planına eklenen öğünleri meals tablosuna ekle
            const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long' }).toLowerCase();
            const dayMap: { [key: string]: string } = {
              'pazartesi': 'pazartesi',
              'salı': 'sali',
              'çarşamba': 'carsamba',
              'perşembe': 'persembe',
              'cuma': 'cuma',
              'cumartesi': 'cumartesi',
              'pazar': 'pazar'
            };
            
            if (dayMap[today] === day) {
              // Duplicate kontrolü
              const existingMeals = await MealService.getTodayMeals(user.id);
              const isDuplicate = existingMeals.some(existingMeal => 
                existingMeal.name === name && 
                existingMeal.total_calories === calories
              );
              
              if (!isDuplicate) {
                // Öğün tipini MealService formatına çevir
                const mealTypeMapping: Record<string, 'breakfast' | 'lunch' | 'dinner' | 'snack'> = {
                  breakfast: 'breakfast',
                  lunch: 'lunch', 
                  dinner: 'dinner',
                  snacks: 'snack'
                };

                await MealService.addMeal({
                  user_id: user.id,
                  name,
                  total_calories: calories,
                  total_protein: protein,
                  total_carbs: carbs,
                  total_fat: fat,
                  meal_type: mealTypeMapping[mealType] || 'lunch'
                });
              }
            }
          }

          // Route params'ı temizle - custom navigation setParams desteklemiyor
          // navigation.setParams({ recipeData: undefined });
          
          Alert.alert('Başarılı', 'Tarif plana eklendi! Kaydetmek için "Kaydet" butonuna basın.');
        } catch (error) {
          console.error('Tarif eklenirken hata:', error);
          Alert.alert('Hata', 'Tarif eklenirken bir hata oluştu');
        }
      };

      handleAddRecipeData();
    }
  }, [route.params?.recipeData, navigation]);

  // IngredientsToRecipeScreen'den gelen selectedRecipe verilerini işle
  useEffect(() => {
    console.log('🔍 selectedRecipe useEffect çalıştı');
    console.log('📦 route.params:', route.params);
    const selectedRecipe = route.params?.selectedRecipe;
    console.log('🎯 selectedRecipe:', selectedRecipe);
    
    // Plan state'ini restore et (eğer varsa)
    if (route.params?.planName) {
      console.log('🔄 Plan state restore ediliyor...');
      setPlanName(route.params.planName);
      setGoal(route.params.goal as any || '');
      setDailyCalories(String(route.params.dailyCalories || 0));
      setDailyProtein(String(route.params.dailyProtein || 0));
      setDailyCarbs(String(route.params.dailyCarbs || 0));
      setDailyFat(String(route.params.dailyFat || 0));
      if (route.params.weeklyPlan) {
        setWeeklyPlan(route.params.weeklyPlan);
      }
      console.log('✅ Plan state restore edildi');
    }
    
    if (selectedRecipe) {
      console.log('✅ selectedRecipe bulundu, işleme başlıyor...');
      const handleAddSelectedRecipe = async () => {
        try {
          // Gelen gün ve öğün tipi bilgilerini kullan, yoksa mevcut seçili olanları kullan
          const targetDay = (selectedRecipe.selectedDay || selectedDay) as keyof DietPlan['weekly_plan'];
          const targetMealType = (selectedRecipe.selectedMealType || selectedMealType) as keyof DayPlan;
          
          console.log('📅 targetDay:', targetDay);
          console.log('🍽️ targetMealType:', targetMealType);
          console.log('🥘 selectedRecipe detayları:', {
            name: selectedRecipe.name,
            calories: selectedRecipe.calories,
            protein: selectedRecipe.protein,
            carbs: selectedRecipe.carbs,
            fat: selectedRecipe.fat
          });

          // Yeni meal objesi oluştur
          const newMeal: MealPlan = {
            id: Date.now().toString(), // Geçici ID
            name: selectedRecipe.name,
            description: selectedRecipe.description || '',
            calories: selectedRecipe.calories,
            protein: selectedRecipe.protein,
            carbs: selectedRecipe.carbs,
            fat: selectedRecipe.fat,
            ingredients: selectedRecipe.ingredients || [],
            instructions: selectedRecipe.steps || [],
          };

          // Global store'u kullanarak tarifi plana ekle
          addRecipeToMeal(targetDay as string, targetMealType, newMeal, undefined);

          // Local state'i de güncelle (UI için)
          setWeeklyPlan(prevPlan => {
            const updatedPlan = { ...prevPlan };
            
            if (updatedPlan[targetDay] && updatedPlan[targetDay][targetMealType]) {
              updatedPlan[targetDay] = {
                ...updatedPlan[targetDay],
                [targetMealType]: [...updatedPlan[targetDay][targetMealType], newMeal]
              };
            }
            
            return updatedPlan;
          });

          // Seçili gün ve öğün tipini güncelle
          setSelectedDay(targetDay);
          setSelectedMealType(targetMealType);

          // Öğünü MealService ile Öğünler sayfasına da kaydet (sadece bugünkü plan için)
          const user = await AuthService.getCurrentUser();
          if (user) {
            // Sadece bugünkü plan için öğün ekle
            const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long' }).toLowerCase();
            const dayMapping: Record<string, string> = {
              'pazartesi': 'pazartesi',
              'salı': 'sali',
              'çarşamba': 'carsamba',
              'perşembe': 'persembe',
              'cuma': 'cuma',
              'cumartesi': 'cumartesi',
              'pazar': 'pazar'
            };
            
            if (dayMapping[today] === targetDay) {
              // Öğün tipini MealService formatına çevir
              const mealTypeMapping: Record<string, 'breakfast' | 'lunch' | 'dinner' | 'snack'> = {
                breakfast: 'breakfast',
                lunch: 'lunch', 
                dinner: 'dinner',
                snacks: 'snack'
              };

              // Duplicate kontrolü yap
              const existingMeals = await MealService.getTodayMeals(user.id);
              const isDuplicate = existingMeals.some(meal => 
                meal.name === selectedRecipe.name && 
                meal.total_calories === selectedRecipe.calories
              );

              if (!isDuplicate) {
                await MealService.addMeal({
                  user_id: user.id,
                  name: selectedRecipe.name,
                  total_calories: selectedRecipe.calories,
                  total_protein: selectedRecipe.protein,
                  total_carbs: selectedRecipe.carbs,
                  total_fat: selectedRecipe.fat,
                  meal_type: mealTypeMapping[targetMealType] || 'lunch'
                });
              }
            }
          }

          // Route params'ı temizle - custom navigation setParams desteklemiyor
          // navigation.setParams({ selectedRecipe: undefined });
          
          Alert.alert('Başarılı', 'Tarif plana eklendi! Kaydetmek için Kaydet butonuna basın.');
        } catch (error) {
          console.error('Tarif eklenirken hata:', error);
          Alert.alert('Hata', 'Tarif eklenirken bir hata oluştu');
        }
      };

      handleAddSelectedRecipe();
    } else {
      console.log('❌ selectedRecipe bulunamadı');
    }
  }, [route.params?.selectedRecipe, navigation]);

  const dayLabels: Record<keyof DietPlan['weekly_plan'], string> = {
    pazartesi: 'Pazartesi',
    sali: 'Salı',
    carsamba: 'Çarşamba',
    persembe: 'Perşembe',
    cuma: 'Cuma',
    cumartesi: 'Cumartesi',
    pazar: 'Pazar',
  };

  const validateForm = () => {
    if (!planName.trim()) {
      Alert.alert('Hata', 'Plan adı gereklidir');
      return false;
    }
    if (!dailyCalories || isNaN(Number(dailyCalories))) {
      Alert.alert('Hata', 'Geçerli bir kalori değeri giriniz');
      return false;
    }
    if (!dailyProtein || isNaN(Number(dailyProtein))) {
      Alert.alert('Hata', 'Geçerli bir protein değeri giriniz');
      return false;
    }
    if (!dailyCarbs || isNaN(Number(dailyCarbs))) {
      Alert.alert('Hata', 'Geçerli bir karbonhidrat değeri giriniz');
      return false;
    }
    if (!dailyFat || isNaN(Number(dailyFat))) {
      Alert.alert('Hata', 'Geçerli bir yağ değeri giriniz');
      return false;
    }
    return true;
  };

  // Otomatik plan kaydetme fonksiyonu
  const autoSavePlan = async () => {
    if (!user?.id) {
      console.log('❌ Kullanıcı oturumu bulunamadı, otomatik kaydetme atlanıyor');
      return;
    }

    try {
      // Öncelik sırası: 1) Mevcut düzenlenen plan, 2) Aktif plan, 3) Yeni plan oluştur
      if (isEditing && existingPlan?.id) {
        // Mevcut plan düzenleniyor
        const planData = {
          user_id: user.id,
          name: planName.trim() || existingPlan.name,
          goal,
          daily_calories: Number(dailyCalories) || existingPlan.daily_calories,
          daily_protein: Number(dailyProtein) || existingPlan.daily_protein,
          daily_carbs: Number(dailyCarbs) || existingPlan.daily_carbs,
          daily_fat: Number(dailyFat) || existingPlan.daily_fat,
          weekly_plan: weeklyPlan,
          is_active: existingPlan.is_active,
        };
        
        await updatePlan(existingPlan.id, planData);
        console.log('✅ Mevcut plan otomatik güncellendi');
      } else if (activePlan?.id) {
         // Aktif plan var, ona ekle (yeni plan oluşturmak yerine)
         const planData = {
           user_id: user.id,
           name: activePlan.name,
           goal: activePlan.goal,
           daily_calories: activePlan.daily_calories,
           daily_protein: activePlan.daily_protein,
           daily_carbs: activePlan.daily_carbs,
           daily_fat: activePlan.daily_fat,
           weekly_plan: weeklyPlan,
           is_active: true,
         };
         
         await updatePlan(activePlan.id, planData);
         console.log('✅ Aktif plana otomatik eklendi - yeni plan oluşturulmadı');
        
        // Form state'ini aktif planla senkronize et (sadece boşsa)
        if (!planName.trim()) setPlanName(activePlan.name);
        if (!goal || goal === 'maintenance') setGoal(activePlan.goal);
        if (!dailyCalories) setDailyCalories(activePlan.daily_calories?.toString() || '2000');
        if (!dailyProtein) setDailyProtein(activePlan.daily_protein?.toString() || '150');
        if (!dailyCarbs) setDailyCarbs(activePlan.daily_carbs?.toString() || '250');
        if (!dailyFat) setDailyFat(activePlan.daily_fat?.toString() || '65');
      } else {
        // Hiç plan yok, yeni plan oluştur
        const planData = {
          user_id: user.id,
          name: planName.trim() || 'Yeni Plan',
          goal,
          daily_calories: Number(dailyCalories) || 2000,
          daily_protein: Number(dailyProtein) || 150,
          daily_carbs: Number(dailyCarbs) || 250,
          daily_fat: Number(dailyFat) || 65,
          weekly_plan: weeklyPlan,
          is_active: true,
        };
        
        // Varsayılan değerleri ayarla
        if (!planName.trim()) {
          setPlanName('Yeni Plan');
        }
        if (!dailyCalories) setDailyCalories('2000');
        if (!dailyProtein) setDailyProtein('150');
        if (!dailyCarbs) setDailyCarbs('250');
        if (!dailyFat) setDailyFat('65');
        
        await createPlan(planData);
        console.log('✅ Yeni plan otomatik oluşturuldu (aktif plan bulunamadı)');
      }
    } catch (error) {
      console.error('❌ Otomatik plan kaydetme hatası:', error);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı');
      return;
    }

    try {
      const planData = {
        user_id: user.id,
        name: planName.trim(),
        goal,
        daily_calories: Number(dailyCalories),
        daily_protein: Number(dailyProtein),
        daily_carbs: Number(dailyCarbs),
        daily_fat: Number(dailyFat),
        weekly_plan: weeklyPlan,
        is_active: !isEditing, // New plans are active by default
      };

      // Mevcut aktif plan var mı kontrol et
      const hasActivePlan = activePlan || currentActivePlan;
      
      if (isEditing && existingPlan?.id) {
        // Mevcut planı güncelle
        await updatePlan(existingPlan.id, planData);
        const updatedPlan = { ...planData, id: existingPlan.id } as DietPlan;
        setCurrentPlan(updatedPlan);
        setActivePlan(updatedPlan);
        
        // Plan değişikliklerini meals tablosuna senkronize et
        await syncPlanToMeals();
        
        Alert.alert('Başarılı', 'Plan güncellendi!', [
          {
            text: 'Tamam',
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Plan');
              }
            }
          }
        ]);
      } else if (hasActivePlan && !isEditing) {
        // Aktif plan varsa güncelle, yeni plan oluşturma
        const planToUpdate = activePlan || currentActivePlan;
        if (planToUpdate?.id) {
          await updatePlan(planToUpdate.id, planData);
          const updatedPlan = { ...planData, id: planToUpdate.id } as DietPlan;
          setCurrentPlan(updatedPlan);
          setActivePlan(updatedPlan);
          
          // Plan değişikliklerini meals tablosuna senkronize et
          await syncPlanToMeals();
          
          Alert.alert('Başarılı', 'Mevcut plan güncellendi!', [
            {
              text: 'Tamam',
              onPress: () => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('Plan');
                }
              }
            }
          ]);
        }
      } else {
        // Yeni plan oluştur
        const newPlan = await createPlan(planData);
        if (newPlan) {
          setCurrentPlan(newPlan);
          setActivePlan(newPlan);
          
          // Plan değişikliklerini meals tablosuna senkronize et
          await syncPlanToMeals();
        }
        Alert.alert('Başarılı', 'Plan oluşturuldu!', [
          {
            text: 'Tamam',
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Plan');
              }
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Plan kaydetme hatası:', error);
      Alert.alert('Hata', 'Plan kaydedilemedi');
    }
  };

  const handleCreateRecipe = (meal: MealPlan) => {
    if (!meal.name || meal.name.trim() === '') {
      Alert.alert('Uyarı', 'Tarif oluşturmak için önce öğün adını girin.');
      return;
    }

    // Navigate to ingredients to recipe screen with meal data and current plan state
    navigation.navigate('ingredientsToRecipe', {
      initialIngredients: meal.description || meal.name,
      mealData: {
        id: meal.id, // Mevcut öğün ID'sini ekle
        name: meal.name,
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fat: meal.fat || 0,
      },
      selectedDay: selectedDay,
      selectedMealType: selectedMealType,
      // Mevcut plan state'ini de gönder
      currentPlanState: {
        planName,
        goal,
        dailyCalories,
        dailyProtein,
        dailyCarbs,
        dailyFat,
        weeklyPlan,
        existingPlan
      },
      updateExistingMeal: true // Yeni öğün ekleme değil, mevcut öğünü güncelleme
    });
  };

  const handleAutoFill = async () => {
    setIsAutoFilling(true);
    
    try {
      // Otomatik plan adı oluştur
      if (!planName.trim()) {
        const goalText = GOAL_OPTIONS.find(opt => opt.value === goal)?.label || 'Beslenme';
        setPlanName(`${goalText} Planım`);
      }

      // Varsayılan makro değerleri hesapla
      if (!dailyCalories || dailyCalories === '0') {
        setDailyCalories('2000');
      }
      if (!dailyProtein || dailyProtein === '0') {
        const calories = Number(dailyCalories) || 2000;
        const protein = Math.round(calories * 0.25 / 4); // %25 protein
        setDailyProtein(protein.toString());
      }
      if (!dailyCarbs || dailyCarbs === '0') {
        const calories = Number(dailyCalories) || 2000;
        const carbs = Math.round(calories * 0.45 / 4); // %45 karbonhidrat
        setDailyCarbs(carbs.toString());
      }
      if (!dailyFat || dailyFat === '0') {
        const calories = Number(dailyCalories) || 2000;
        const fat = Math.round(calories * 0.30 / 9); // %30 yağ
        setDailyFat(fat.toString());
      }

      Alert.alert('Başarılı', 'Form otomatik olarak dolduruldu! İsterseniz AI ile tam plan oluşturabilirsiniz.');
    } catch (error) {
      console.error('Auto fill error:', error);
      Alert.alert('Hata', 'Otomatik doldurma sırasında bir hata oluştu');
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!planName.trim()) {
      Alert.alert('Hata', 'Önce plan adı giriniz');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const aiPlan = await generateAIPlan({
        goal,
        targetCalories: Number(dailyCalories) || 2000,
        targetProtein: Number(dailyProtein) || 100,
        targetCarbs: Number(dailyCarbs) || 250,
        targetFat: Number(dailyFat) || 70,
      });

      if (aiPlan && aiPlan.weekly_plan) {
        // Güvenli weekly_plan güncellemesi
        const safeWeeklyPlan = { ...getInitialWeeklyPlan() };
        
        // AI planından gelen verileri güvenli şekilde kopyala
        Object.keys(aiPlan.weekly_plan).forEach(day => {
          if (safeWeeklyPlan[day] && aiPlan.weekly_plan[day]) {
            const dayPlan = aiPlan.weekly_plan[day];
            safeWeeklyPlan[day] = {
              breakfast: Array.isArray(dayPlan.breakfast) ? dayPlan.breakfast : [],
              lunch: Array.isArray(dayPlan.lunch) ? dayPlan.lunch : [],
              dinner: Array.isArray(dayPlan.dinner) ? dayPlan.dinner : [],
              snacks: Array.isArray(dayPlan.snacks) ? dayPlan.snacks : []
            };
          }
        });
        
        setWeeklyPlan(safeWeeklyPlan);
        setDailyCalories(aiPlan.daily_calories?.toString() || dailyCalories);
        setDailyProtein(aiPlan.daily_protein?.toString() || dailyProtein);
        setDailyCarbs(aiPlan.daily_carbs?.toString() || dailyCarbs);
        setDailyFat(aiPlan.daily_fat?.toString() || dailyFat);
        Alert.alert('Başarılı', 'AI plan önerisi oluşturuldu!');
      } else {
        Alert.alert('Uyarı', 'AI plan oluşturuldu ancak veri eksik. Lütfen manuel olarak düzenleyin.');
      }
    } catch (error) {
      console.error('AI plan generation error:', error);
      Alert.alert('Hata', 'AI plan önerisi oluşturulamadı');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const addMeal = async () => {
    const newMeal: MealPlan = {
      id: Date.now().toString(),
      name: 'Yeni Öğün',
      description: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    try {
      // Önce local state'i güncelle (UI için)
      setWeeklyPlan(prev => ({
        ...prev,
        [selectedDay]: {
          ...prev[selectedDay],
          [selectedMealType]: [...prev[selectedDay][selectedMealType], newMeal],
        },
      }));

      // Sonra global state'i güncelle (persistence için)
      await updateExistingPlan(String(selectedDay), selectedMealType, newMeal);
    } catch (error) {
      console.error('Plan güncelleme hatası:', error);
      // Hata durumunda local state'i geri al
      setWeeklyPlan(prev => ({
        ...prev,
        [selectedDay]: {
          ...prev[selectedDay],
          [selectedMealType]: prev[selectedDay][selectedMealType].filter(meal => meal.id !== newMeal.id),
        },
      }));
    }
  };

  const updateMeal = (mealIndex: number, field: keyof MealPlan, value: string | number) => {
    // Local state'i güncelle
    setWeeklyPlan(prev => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [selectedMealType]: prev[selectedDay][selectedMealType].map((meal, index) =>
          index === mealIndex ? { ...meal, [field]: value } : meal
        ),
      },
    }));

    // Global state'i de güncelle
    updatePlanMeal(String(selectedDay), selectedMealType, mealIndex, { [field]: value });
  };

  const deleteMeal = (mealIndex: number) => {
    // Local state'i güncelle
    setWeeklyPlan(prev => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [selectedMealType]: prev[selectedDay][selectedMealType].filter((_, index) => index !== mealIndex),
      },
    }));

    // Global state'i de güncelle
    removeMealFromPlan(String(selectedDay), selectedMealType, mealIndex);
  };

  const currentMeals = weeklyPlan[selectedDay][selectedMealType];

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <LinearGradient
        colors={isDark ? ['#1a1a1a', '#2d2d2d'] : ['#f8f9fa', '#e9ecef']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#2C3E50'} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text 
              style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {isEditing ? 'Planı Düzenle' : 'Yeni Plan'}
            </Text>
            <Text 
              style={[styles.headerSubtitle, { color: isDark ? '#B0B0B0' : '#7F8C8D' }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {isEditing ? 'Mevcut planı güncelleyin' : 'Yeni beslenme planı oluşturun'}
            </Text>
          </View>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.autoFillButton}
              onPress={handleAutoFill}
              disabled={isAutoFilling}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                style={styles.autoFillButtonGradient}
              >
                {isAutoFilling ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.autoFillButtonText}>Doldur</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="flash" size={12} color="white" />
                    <Text style={styles.autoFillButtonText}>Doldur</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.aiButton}
              onPress={handleGenerateAI}
              disabled={isGeneratingAI}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.aiButtonGradient}
              >
                {isGeneratingAI ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.aiButtonText}>AI</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={12} color="white" />
                    <Text style={styles.aiButtonText}>AI</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Plan Info Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                Plan Bilgileri
              </Text>
              
              <LinearGradient
                colors={isDark ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']}
                style={styles.card}
              >
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                    Plan Adı
                  </Text>
                  <TextInput
                    style={[styles.input, { 
                      color: isDark ? '#FFFFFF' : '#2C3E50',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                    }]}
                    placeholder="Örn: Kilo Verme Planım"
                    placeholderTextColor={isDark ? '#888888' : '#999999'}
                    value={planName}
                    onChangeText={setPlanName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                    Hedef
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalContainer}>
                    {GOAL_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.goalChip,
                          goal === option.value && styles.goalChipActive,
                          { borderColor: option.color }
                        ]}
                        onPress={() => setGoal(option.value)}
                      >
                        <Ionicons 
                          name={option.icon as any} 
                          size={16} 
                          color={goal === option.value ? option.color : (isDark ? '#888888' : '#999999')} 
                        />
                        <Text style={[
                          styles.goalChipText,
                          goal === option.value && { color: option.color },
                          { color: goal === option.value ? option.color : (isDark ? '#FFFFFF' : '#2C3E50') }
                        ]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </LinearGradient>
            </View>

            {/* Nutrition Targets Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                Günlük Hedefler
              </Text>
              
              <LinearGradient
                colors={isDark ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']}
                style={styles.card}
              >
                <View style={styles.nutritionGrid}>
                  <View style={styles.nutritionItem}>
                    <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                      Kalori
                    </Text>
                    <TextInput
                      style={[styles.input, { 
                        color: isDark ? '#FFFFFF' : '#2C3E50',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                      }]}
                      placeholder="2000"
                      placeholderTextColor={isDark ? '#888888' : '#999999'}
                      keyboardType="numeric"
                      value={dailyCalories}
                      onChangeText={setDailyCalories}
                    />
                  </View>

                  <View style={styles.nutritionItem}>
                    <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                      Protein (g)
                    </Text>
                    <TextInput
                      style={[styles.input, { 
                        color: isDark ? '#FFFFFF' : '#2C3E50',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                      }]}
                      placeholder="100"
                      placeholderTextColor={isDark ? '#888888' : '#999999'}
                      keyboardType="numeric"
                      value={dailyProtein}
                      onChangeText={setDailyProtein}
                    />
                  </View>

                  <View style={styles.nutritionItem}>
                    <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                      Karbonhidrat (g)
                    </Text>
                    <TextInput
                      style={[styles.input, { 
                        color: isDark ? '#FFFFFF' : '#2C3E50',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                      }]}
                      placeholder="250"
                      placeholderTextColor={isDark ? '#888888' : '#999999'}
                      keyboardType="numeric"
                      value={dailyCarbs}
                      onChangeText={setDailyCarbs}
                    />
                  </View>

                  <View style={styles.nutritionItem}>
                    <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                      Yağ (g)
                    </Text>
                    <TextInput
                      style={[styles.input, { 
                        color: isDark ? '#FFFFFF' : '#2C3E50',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                      }]}
                      placeholder="70"
                      placeholderTextColor={isDark ? '#888888' : '#999999'}
                      keyboardType="numeric"
                      value={dailyFat}
                      onChangeText={setDailyFat}
                    />
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Weekly Plan Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                Haftalık Plan
              </Text>
              
              {/* Day Selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
                {Object.entries(dayLabels).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.dayChip,
                      selectedDay === key && styles.dayChipActive
                    ]}
                    onPress={() => setSelectedDay(key as keyof DietPlan['weekly_plan'])}
                  >
                    <Text style={[
                      styles.dayChipText,
                      selectedDay === key && styles.dayChipTextActive,
                      { color: selectedDay === key ? '#667eea' : (isDark ? '#FFFFFF' : '#2C3E50') }
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Meal Type Selector - Improved */}
              <View style={styles.mealTypeSelectorContainer}>
                <Text style={[styles.mealTypeSelectorTitle, { color: isDark ? '#CCCCCC' : '#666666' }]}>
                  Öğün Tipi Seçin:
                </Text>
                <View style={styles.mealTypeSelector}>
                  {MEAL_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.mealTypeChip,
                        selectedMealType === type.value && [
                          styles.mealTypeChipActive,
                          { 
                            backgroundColor: `${type.color}20`,
                            borderColor: `${type.color}40`
                          }
                        ]
                      ]}
                      onPress={() => setSelectedMealType(type.value)}
                    >
                      <Ionicons 
                        name={type.icon as any} 
                        size={16} 
                        color={selectedMealType === type.value ? type.color : (isDark ? '#888888' : '#999999')} 
                      />
                      <Text style={[
                        styles.mealTypeChipText,
                        selectedMealType === type.value && styles.mealTypeChipTextActive,
                        { color: selectedMealType === type.value ? type.color : (isDark ? '#FFFFFF' : '#2C3E50') }
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Meals List - Enhanced */}
              <LinearGradient
                colors={isDark ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']}
                style={styles.card}
              >
                <View style={styles.mealsHeader}>
                  <View style={styles.mealsHeaderInfo}>
                    <Text style={[styles.mealsTitle, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                      {MEAL_TYPES.find(t => t.value === selectedMealType)?.label}
                    </Text>
                    <Text style={[styles.mealsSubtitle, { color: isDark ? '#CCCCCC' : '#666666' }]}>
                      {dayLabels[selectedDay]} - {currentMeals.length} öğün
                    </Text>
                  </View>
                  <View style={styles.mealsHeaderActions}>
                    <TouchableOpacity 
                      style={[
                        styles.addMealButton,
                        { backgroundColor: `${selectedMealTypeData?.color}20` }
                      ]} 
                      onPress={addMeal}
                    >
                      <Ionicons name="add" size={20} color={selectedMealTypeData?.color || "#667eea"} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.addRecipeButton,
                        { 
                          backgroundColor: `${selectedMealTypeData?.color}20`,
                          borderColor: `${selectedMealTypeData?.color}30`
                        }
                      ]}
                      onPress={() => navigation.navigate('RecipeSearch', { 
                        selectedDay, 
                        selectedMealType,
                        returnScreen: 'PlanEdit'
                      })}
                    >
                      <Ionicons name="restaurant" size={16} color={selectedMealTypeData?.color || "#667eea"} />
                      <Text style={[
                        styles.addRecipeButtonText,
                        { color: selectedMealTypeData?.color || "#667eea" }
                      ]}>Tarif Ekle</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {currentMeals.length === 0 ? (
                  <View style={styles.emptyMeals}>
                    <Ionicons name="restaurant-outline" size={48} color={isDark ? '#666666' : '#BDC3C7'} />
                    <Text style={[styles.emptyMealsText, { color: isDark ? '#888888' : '#999999' }]}>
                      Henüz öğün eklenmemiş
                    </Text>
                  </View>
                ) : (
                  currentMeals.map((meal, index) => (
                    <View key={meal.id || index} style={styles.mealCard}>
                      <View style={styles.mealHeader}>
                        <TextInput
                          style={[styles.mealNameInput, { 
                            color: isDark ? '#FFFFFF' : '#2C3E50',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                          }]}
                          placeholder="Öğün adı"
                          placeholderTextColor={isDark ? '#888888' : '#999999'}
                          value={meal.name}
                          onChangeText={(value) => updateMeal(index, 'name', value)}
                        />
                        <TouchableOpacity
                          style={styles.deleteMealButton}
                          onPress={() => deleteMeal(index)}
                        >
                          <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                        </TouchableOpacity>
                      </View>

                      <TextInput
                        style={[styles.mealDescriptionInput, { 
                          color: isDark ? '#FFFFFF' : '#2C3E50',
                          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                        }]}
                        placeholder="Açıklama (opsiyonel)"
                        placeholderTextColor={isDark ? '#888888' : '#999999'}
                        value={meal.description}
                        onChangeText={(value) => updateMeal(index, 'description', value)}
                        multiline
                      />

                      <View style={styles.mealNutritionGrid}>
                        <View style={styles.mealNutritionItem}>
                          <Text style={[styles.mealNutritionLabel, { color: isDark ? '#B0B0B0' : '#7F8C8D' }]}>
                            Kalori
                          </Text>
                          <TextInput
                            style={[styles.mealNutritionInput, { 
                              color: isDark ? '#FFFFFF' : '#2C3E50',
                              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                            }]}
                            placeholder="0"
                            placeholderTextColor={isDark ? '#888888' : '#999999'}
                            keyboardType="numeric"
                            value={meal.calories?.toString() || ''}
                            onChangeText={(value) => updateMeal(index, 'calories', Number(value) || 0)}
                          />
                        </View>

                        <View style={styles.mealNutritionItem}>
                          <Text style={[styles.mealNutritionLabel, { color: isDark ? '#B0B0B0' : '#7F8C8D' }]}>
                            Protein
                          </Text>
                          <TextInput
                            style={[styles.mealNutritionInput, { 
                              color: isDark ? '#FFFFFF' : '#2C3E50',
                              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                            }]}
                            placeholder="0"
                            placeholderTextColor={isDark ? '#888888' : '#999999'}
                            keyboardType="numeric"
                            value={meal.protein?.toString() || ''}
                            onChangeText={(value) => updateMeal(index, 'protein', Number(value) || 0)}
                          />
                        </View>

                        <View style={styles.mealNutritionItem}>
                          <Text style={[styles.mealNutritionLabel, { color: isDark ? '#B0B0B0' : '#7F8C8D' }]}>
                            Karb.
                          </Text>
                          <TextInput
                            style={[styles.mealNutritionInput, { 
                              color: isDark ? '#FFFFFF' : '#2C3E50',
                              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                            }]}
                            placeholder="0"
                            placeholderTextColor={isDark ? '#888888' : '#999999'}
                            keyboardType="numeric"
                            value={meal.carbs?.toString() || ''}
                            onChangeText={(value) => updateMeal(index, 'carbs', Number(value) || 0)}
                          />
                        </View>

                        <View style={styles.mealNutritionItem}>
                          <Text style={[styles.mealNutritionLabel, { color: isDark ? '#B0B0B0' : '#7F8C8D' }]}>
                            Yağ
                          </Text>
                          <TextInput
                            style={[styles.mealNutritionInput, { 
                              color: isDark ? '#FFFFFF' : '#2C3E50',
                              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                            }]}
                            placeholder="0"
                            placeholderTextColor={isDark ? '#888888' : '#999999'}
                            keyboardType="numeric"
                            value={meal.fat?.toString() || ''}
                            onChangeText={(value) => updateMeal(index, 'fat', Number(value) || 0)}
                          />
                        </View>
                      </View>

                      {/* Recipe Creation Button */}
                      <TouchableOpacity
                        style={[styles.createRecipeButton, { 
                          backgroundColor: isDark ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.15)' 
                        }]}
                        onPress={() => handleCreateRecipe(meal)}
                      >
                        <Ionicons name="restaurant" size={16} color="#667eea" />
                        <Text style={[styles.createRecipeButtonText, { color: '#667eea' }]}>
                          Tarif Oluştur
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </LinearGradient>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={[styles.cancelButtonText, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                  İptal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.saveButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color="white" />
                      <Text style={styles.saveButtonText}>
                        {isEditing ? 'Güncelle' : 'Kaydet'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
    minWidth: 0, // Flex shrinking için gerekli
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    flexShrink: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
    flexShrink: 1,
  },
  headerButtons: {
    flexDirection: 'column',
    gap: 4,
    alignItems: 'flex-end',
  },
  autoFillButton: {
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  autoFillButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 80,
  },
  autoFillButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  aiButton: {
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 80,
  },
  aiButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  card: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  goalContainer: {
    marginTop: 8,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  goalChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  goalChipText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionItem: {
    flex: 1,
    minWidth: (width - 80) / 2,
  },
  daySelector: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  daySelectorContainer: {
    marginBottom: 16,
  },
  daySelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dayChipActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderColor: 'rgba(102, 126, 234, 0.4)',
  },
  dayChipToday: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    borderColor: 'rgba(46, 204, 113, 0.4)',
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dayChipTextActive: {
    fontWeight: '600',
    color: '#667EEA',
  },
  dayChipTextToday: {
    fontWeight: '600',
    color: '#2ECC71',
  },
  todayIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#2ECC71',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  todayIndicatorText: {
    fontSize: 8,
    fontWeight: '600',
    color: 'white',
  },
  mealTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  mealTypeSelectorContainer: {
    marginBottom: 16,
  },
  mealTypeSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  mealTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  mealTypeChipActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
  },
  mealTypeChipText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  mealTypeChipTextActive: {
    fontWeight: '600',
  },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealsHeaderInfo: {
    flex: 1,
  },
  mealsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  mealsSubtitle: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  mealsHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addMealButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  addRecipeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    color: '#667EEA',
  },
  emptyMeals: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyMealsText: {
    fontSize: 14,
    marginTop: 8,
  },
  mealCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealNameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteMealButton: {
    marginLeft: 12,
    padding: 8,
  },
  mealDescriptionInput: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  mealNutritionGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  mealNutritionItem: {
    flex: 1,
  },
  mealNutritionLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  mealNutritionInput: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  createRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  createRecipeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
});