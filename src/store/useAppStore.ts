import { create } from 'zustand';
import { User, Meal, HealthData, Recipe } from '../types/types';
import { DietPlan, WeeklyPlan, DayPlan, MealPlan } from '../services/planService';

interface AppState {
  // Kullanıcı durumu
  user: User | null;
  isAuthenticated: boolean;
  
  // Öğün verileri
  meals: Meal[];
  todayMeals: Meal[];
  
  // Sağlık verileri
  healthData: HealthData[];
  
  // Tarifler
  recipes: Recipe[];
  favoriteRecipes: Recipe[];
  
  // Plan yönetimi
  currentPlan: DietPlan | null;
  activePlan: DietPlan | null; // Aktif plan (veritabanından)
  isEditingPlan: boolean;
  planMealSync: boolean; // Plan-Meal senkronizasyon durumu
  
  // UI durumu
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  addMeal: (meal: Meal) => void;
  updateMeal: (mealId: string, updatedMeal: Partial<Meal>) => void;
  deleteMeal: (mealId: string) => void;
  
  addHealthData: (data: HealthData) => void;
  updateHealthData: (date: string, data: Partial<HealthData>) => void;
  
  addRecipe: (recipe: Recipe) => void;
  addFavoriteRecipe: (recipe: Recipe) => void;
  removeFavoriteRecipe: (recipeId: string) => void;
  
  // Plan yönetimi actions
  createNewPlan: (planData: Partial<DietPlan>) => void;
  setCurrentPlan: (plan: DietPlan | null) => void;
  setActivePlan: (plan: DietPlan | null) => void;
  addRecipeToMeal: (day: string, mealType: keyof DayPlan, recipe: MealPlan, planData?: Partial<DietPlan>) => void;
  updatePlanMeal: (day: string, mealType: keyof DayPlan, mealIndex: number, updatedMeal: Partial<MealPlan>) => void;
  updateMealById: (mealId: string, updatedMeal: Partial<MealPlan>) => void;
  removeMealFromPlan: (day: string, mealType: keyof DayPlan, mealIndex: number) => void;
  clearCurrentPlan: () => void;
  setEditingPlan: (isEditing: boolean) => void;
  setPlanMealSync: (sync: boolean) => void;
  
  // Plan-Meal senkronizasyon fonksiyonları
  syncPlanToMeals: () => Promise<void>;
  syncMealsToPlan: () => Promise<void>;
  updateExistingPlan: (day: string, mealType: keyof DayPlan, recipe: MealPlan) => Promise<void>;
  loadActivePlan: (userId: string) => Promise<void>;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Hesaplamalar
  getTodayCalories: () => number;
  getTodayProtein: () => number;
  getTodayCarbs: () => number;
  getTodayFat: () => number;
  getTodayWater: () => number;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  meals: [],
  todayMeals: [],
  healthData: [],
  recipes: [],
  favoriteRecipes: [],
  currentPlan: null,
  activePlan: null,
  isEditingPlan: false,
  planMealSync: false,
  isLoading: false,
  error: null,

  // User actions
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user 
  }),

  // Meal actions
  addMeal: (meal) => set((state) => ({
    meals: [...state.meals, meal],
    todayMeals: [...state.todayMeals, meal]
  })),

  updateMeal: (mealId, updatedMeal) => set((state) => ({
    meals: state.meals.map(meal => 
      meal.id === mealId ? { ...meal, ...updatedMeal } : meal
    ),
    todayMeals: state.todayMeals.map(meal => 
      meal.id === mealId ? { ...meal, ...updatedMeal } : meal
    )
  })),

  deleteMeal: (mealId) => set((state) => ({
    meals: state.meals.filter(meal => meal.id !== mealId),
    todayMeals: state.todayMeals.filter(meal => meal.id !== mealId)
  })),

  // Health data actions
  addHealthData: (data) => set((state) => ({
    healthData: [...state.healthData, data]
  })),

  updateHealthData: (date, data) => set((state) => ({
    healthData: state.healthData.map(item => 
      item.date === date ? { ...item, ...data } : item
    )
  })),

  // Recipe actions
  addRecipe: (recipe) => set((state) => ({
    recipes: [...state.recipes, recipe]
  })),

  addFavoriteRecipe: (recipe) => set((state) => ({
    favoriteRecipes: [...state.favoriteRecipes, recipe]
  })),

  removeFavoriteRecipe: (recipeId) => set((state) => ({
    favoriteRecipes: state.favoriteRecipes.filter(recipe => recipe.id !== recipeId)
  })),

  // Plan yönetimi actions
  createNewPlan: (planData) => {
    // Her zaman temiz bir weekly plan oluştur
    const getInitialWeeklyPlan = (): WeeklyPlan => ({
      pazartesi: { breakfast: [], lunch: [], dinner: [], snacks: [] },
      sali: { breakfast: [], lunch: [], dinner: [], snacks: [] },
      carsamba: { breakfast: [], lunch: [], dinner: [], snacks: [] },
      persembe: { breakfast: [], lunch: [], dinner: [], snacks: [] },
      cuma: { breakfast: [], lunch: [], dinner: [], snacks: [] },
      cumartesi: { breakfast: [], lunch: [], dinner: [], snacks: [] },
      pazar: { breakfast: [], lunch: [], dinner: [], snacks: [] },
    });

    const newPlan: DietPlan = {
      id: Date.now().toString(), // Her zaman yeni ID oluştur
      user_id: planData.user_id || '',
      name: planData.name || 'Yeni Plan',
      goal: planData.goal || 'maintenance',
      daily_calories: planData.daily_calories || 2000,
      daily_protein: planData.daily_protein || 150,
      daily_carbs: planData.daily_carbs || 250,
      daily_fat: planData.daily_fat || 65,
      weekly_plan: getInitialWeeklyPlan(), // Her zaman temiz plan
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set({ currentPlan: newPlan, isEditingPlan: true });
  },

  setCurrentPlan: (plan) => set({ currentPlan: plan }),

  addRecipeToMeal: (day, mealType, recipe, planData) => set((state) => {
    const { currentPlan } = state;
    
    // Eğer currentPlan yoksa yeni bir plan oluştur
    let planToUpdate = currentPlan;
    
    if (!planToUpdate) {
      const getInitialWeeklyPlan = (): WeeklyPlan => ({
        pazartesi: { breakfast: [], lunch: [], dinner: [], snacks: [] },
        sali: { breakfast: [], lunch: [], dinner: [], snacks: [] },
        carsamba: { breakfast: [], lunch: [], dinner: [], snacks: [] },
        persembe: { breakfast: [], lunch: [], dinner: [], snacks: [] },
        cuma: { breakfast: [], lunch: [], dinner: [], snacks: [] },
        cumartesi: { breakfast: [], lunch: [], dinner: [], snacks: [] },
        pazar: { breakfast: [], lunch: [], dinner: [], snacks: [] },
      });

      planToUpdate = {
        id: Date.now().toString(),
        user_id: '',
        name: planData?.name || 'Yeni Plan',
        goal: planData?.goal || 'maintenance',
        daily_calories: planData?.daily_calories || 2000,
        daily_protein: planData?.daily_protein || 150,
        daily_carbs: planData?.daily_carbs || 250,
        daily_fat: planData?.daily_fat || 65,
        weekly_plan: getInitialWeeklyPlan(), // Her zaman temiz plan
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Günlük planı al ve güncelle
    const dayPlan = planToUpdate.weekly_plan[day as keyof WeeklyPlan];
    const updatedDayPlan = {
      ...dayPlan,
      [mealType]: [...dayPlan[mealType], recipe]
    };

    // Haftalık planı güncelle
    const updatedWeeklyPlan = {
      ...planToUpdate.weekly_plan,
      [day]: updatedDayPlan
    };

    // Planı güncelle
    const updatedPlan = {
      ...planToUpdate,
      weekly_plan: updatedWeeklyPlan,
      updated_at: new Date().toISOString()
    };

    return { currentPlan: updatedPlan, isEditingPlan: true };
  }),

  updatePlanMeal: (day, mealType, mealIndex, updatedMeal) => set((state) => {
    if (!state.currentPlan) return state;

    const updatedPlan = { ...state.currentPlan };
    
    if (updatedPlan.weekly_plan[day] && updatedPlan.weekly_plan[day][mealType]) {
      updatedPlan.weekly_plan[day][mealType] = updatedPlan.weekly_plan[day][mealType].map(
        (meal, index) => index === mealIndex ? { ...meal, ...updatedMeal } : meal
      );
    }

    return { currentPlan: updatedPlan };
  }),

  updateMealById: (mealId: string, updatedMeal: Partial<MealPlan>) => set((state) => {
    if (!state.currentPlan) return state;

    const updatedPlan = { ...state.currentPlan };
    
    // Tüm günleri ve öğün tiplerini kontrol et
    Object.keys(updatedPlan.weekly_plan).forEach(day => {
      (Object.keys(updatedPlan.weekly_plan[day]) as (keyof DayPlan)[]).forEach(mealType => {
        updatedPlan.weekly_plan[day][mealType] = updatedPlan.weekly_plan[day][mealType].map(
          (meal: MealPlan) => meal.id === mealId ? { ...meal, ...updatedMeal } : meal
        );
      });
    });

    return { currentPlan: updatedPlan };
  }),

  removeMealFromPlan: (day, mealType, mealIndex) => set((state) => {
    if (!state.currentPlan) return state;

    const updatedPlan = { ...state.currentPlan };
    
    if (updatedPlan.weekly_plan[day] && updatedPlan.weekly_plan[day][mealType]) {
      updatedPlan.weekly_plan[day][mealType] = updatedPlan.weekly_plan[day][mealType].filter(
        (_, index) => index !== mealIndex
      );
    }

    return { currentPlan: updatedPlan };
  }),

  clearCurrentPlan: () => set({ currentPlan: null, isEditingPlan: false }),

  setEditingPlan: (isEditing) => set({ isEditingPlan: isEditing }),

  setActivePlan: (plan) => set({ activePlan: plan }),

  setPlanMealSync: (sync) => set({ planMealSync: sync }),

  // Plan-Meal senkronizasyon fonksiyonları
  syncPlanToMeals: async () => {
    // Plan değişikliklerini meals tablosuna yansıt
    const { currentPlan, user } = get();
    if (!currentPlan || !user) return;

    try {
      const { MealService } = await import('../services/mealService');
      
      // Bugünün tarihini al
      const today = new Date().toISOString().split('T')[0];
      const dayOfWeek = new Date().toLocaleDateString('tr-TR', { weekday: 'long' }).toLowerCase();
      
      // Gün eşleştirme
      const dayMap: { [key: string]: string } = {
        'pazartesi': 'pazartesi',
        'salı': 'sali',
        'çarşamba': 'carsamba',
        'perşembe': 'persembe',
        'cuma': 'cuma',
        'cumartesi': 'cumartesi',
        'pazar': 'pazar'
      };
      
      const planDayKey = dayMap[dayOfWeek];
      
      // Sadece bugünün planını meals tablosuna ekle (duplicate önlemek için)
      if (planDayKey && currentPlan.weekly_plan[planDayKey]) {
        const todayPlan = currentPlan.weekly_plan[planDayKey];
        
        // Bugünün mevcut öğünlerini kontrol et (duplicate önlemek için)
        const existingMeals = await MealService.getTodayMeals(user.id);
        
        // Öğün tiplerini sırayla işle
        for (const [mealType, meals] of Object.entries(todayPlan)) {
          for (const meal of meals) {
            // Aynı isimde öğün bugün zaten var mı kontrol et
            const isDuplicate = existingMeals.some(existingMeal => 
              existingMeal.name === meal.name && 
              existingMeal.total_calories === meal.calories
            );
            
            if (!isDuplicate) {
              const mealTypeMapping: Record<string, 'breakfast' | 'lunch' | 'dinner' | 'snack'> = {
                breakfast: 'breakfast',
                lunch: 'lunch', 
                dinner: 'dinner',
                snacks: 'snack'
              };

              await MealService.addMeal({
                user_id: user.id,
                name: meal.name,
                total_calories: meal.calories,
                total_protein: meal.protein,
                total_carbs: meal.carbs,
                total_fat: meal.fat,
                meal_type: mealTypeMapping[mealType] || 'lunch'
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Plan-Meal senkronizasyon hatası:', error);
    }
  },

  syncMealsToPlan: async () => {
    // Meals tablosundaki değişiklikleri plana yansıt
    // Bu fonksiyon gerektiğinde implement edilecek
  },

  updateExistingPlan: async (day, mealType, recipe) => {
    const { activePlan, currentPlan, syncPlanToMeals } = get();
    const planToUpdate = activePlan || currentPlan;
    
    if (!planToUpdate) return;

    try {
      const { PlanService } = await import('../services/planService');
      
      // Mevcut planı güncelle (yeni plan oluşturma)
      const updatedPlan = { ...planToUpdate };
      
      if (!updatedPlan.weekly_plan[day]) {
        updatedPlan.weekly_plan[day] = {
          breakfast: [],
          lunch: [],
          dinner: [],
          snacks: []
        };
      }

      // Ensure mealType array exists
      if (!updatedPlan.weekly_plan[day][mealType]) {
        updatedPlan.weekly_plan[day][mealType] = [];
      }

      updatedPlan.weekly_plan[day][mealType].push(recipe);
      updatedPlan.updated_at = new Date().toISOString();

      // Veritabanını güncelle
      if (planToUpdate.id) {
        await PlanService.updatePlan(planToUpdate.id, updatedPlan);
        set({ activePlan: updatedPlan, currentPlan: updatedPlan });
        
        // Plan değişikliklerini meals tablosuna senkronize et
        await syncPlanToMeals();
      }
    } catch (error) {
      console.error('Plan update error:', error);
    }
  },

  loadActivePlan: async (userId) => {
    try {
      const { PlanService } = await import('../services/planService');
      const activePlan = await PlanService.getActivePlan(userId);
      
      if (activePlan) {
        // Güvenlik kontrolü: Plan'ın user_id'si istenen userId ile eşleşmeli
        if (activePlan.user_id !== userId) {
          console.error('Plan user_id mismatch! Plan user_id:', activePlan.user_id, 'Expected:', userId);
          return;
        }
        
        set({ activePlan, currentPlan: activePlan });
        
        // Aktif plan yüklendikten sonra plan öğünlerini meals tablosuna senkronize et
        const { syncPlanToMeals } = get();
        await syncPlanToMeals();
      }
    } catch (error) {
      console.error('Aktif plan yükleme hatası:', error);
    }
  },

  // UI actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Calculations
  getTodayCalories: () => {
    const today = new Date().toDateString();
    return get().todayMeals
      .filter(meal => new Date(meal.timestamp).toDateString() === today)
      .reduce((total, meal) => total + meal.totalCalories, 0);
  },

  getTodayProtein: () => {
    const today = new Date().toDateString();
    return get().todayMeals
      .filter(meal => new Date(meal.timestamp).toDateString() === today)
      .reduce((total, meal) => total + meal.totalProtein, 0);
  },

  getTodayCarbs: () => {
    const today = new Date().toDateString();
    return get().todayMeals
      .filter(meal => new Date(meal.timestamp).toDateString() === today)
      .reduce((total, meal) => total + meal.totalCarbs, 0);
  },

  getTodayFat: () => {
    const today = new Date().toDateString();
    return get().todayMeals
      .filter(meal => new Date(meal.timestamp).toDateString() === today)
      .reduce((total, meal) => total + meal.totalFat, 0);
  },

  getTodayWater: () => {
    const today = new Date().toDateString();
    const todayHealthData = get().healthData.find(data => data.date === today);
    return todayHealthData?.waterIntake || 0;
  },
}));
