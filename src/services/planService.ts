import { supabase } from './supabase';
import { AIVisionService } from './api';
import { AIMealPlanService } from './aiMealPlanService';

export interface DietPlan {
  id?: string;
  user_id: string;
  name: string;
  goal: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain';
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
  weekly_plan: WeeklyPlan;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WeeklyPlan {
  [key: string]: DayPlan;
}

export interface DayPlan {
  breakfast: MealPlan[];
  lunch: MealPlan[];
  dinner: MealPlan[];
  snacks: MealPlan[];
}

export interface MealPlan {
  id: string;
  name: string;
  description?: string; // Added description field for meal details
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients?: string[];
  instructions?: string[];
}

export class PlanService {
  /**
   * Kullanıcının aktif diyet planını getir
   */
  static async getActivePlan(userId: string): Promise<DietPlan | null> {
    try {
      const { data, error } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();



      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error: any) {
      console.error('Aktif plan getirme hatası:', error);
      throw new Error('Aktif plan getirilemedi');
    }
  }

  /**
   * ID'ye göre plan getir
   */
  static async getPlanById(planId: string): Promise<DietPlan | null> {
    try {
      const { data, error } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error: any) {
      console.error('Plan getirme hatası:', error);
      throw new Error('Plan getirilemedi');
    }
  }

  /**
   * Kullanıcının tüm planlarını getir
   */
  static async getUserPlans(userId: string): Promise<DietPlan[]> {
    try {
      const { data, error } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Kullanıcı planları getirme hatası:', error);
      throw new Error('Planlar getirilemedi');
    }
  }

  /**
   * Yeni diyet planı oluştur
   */
  static async createPlan(planData: Omit<DietPlan, 'id' | 'created_at' | 'updated_at'>): Promise<DietPlan> {
    try {
      // Mevcut aktif planı pasif yap
      if (planData.is_active) {
        await supabase
          .from('diet_plans')
          .update({ is_active: false })
          .eq('user_id', planData.user_id)
          .eq('is_active', true);
      }

      const { data, error } = await supabase
        .from('diet_plans')
        .insert([{ 
          ...planData, 
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString() 
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Plan oluşturma hatası:', error);
      throw new Error('Plan oluşturulamadı');
    }
  }

  /**
   * Diyet planını güncelle
   */
  static async updatePlan(planId: string, updates: Partial<DietPlan>): Promise<void> {
    try {
      const { error } = await supabase
        .from('diet_plans')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (error) {
        if (error.code === 'PGRST205') {
          console.warn("'diet_plans' tablosu bulunamadı. Güncelleme atlandı (fallback).");
          return; // Backend tablo yoksa sessizce çık (UI çalışmaya devam etsin)
        }
        throw error;
      }
    } catch (error: any) {
      console.error('Plan güncelleme hatası:', error);
      throw new Error('Plan güncellenemedi');
    }
  }

  /**
   * Planı aktif/pasif yap
   */
  static async togglePlanActive(planId: string, userId: string): Promise<void> {
    try {
      // Önce tüm planları pasif yap
      const disableAll = await supabase
        .from('diet_plans')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (disableAll.error) {
        if (disableAll.error.code === 'PGRST205') {
          console.warn("'diet_plans' tablosu bulunamadı. Aktiflik güncellemesi atlandı (fallback).");
          return;
        }
        throw disableAll.error;
      }

      // Seçilen planı aktif yap
      const { error } = await supabase
        .from('diet_plans')
        .update({ is_active: true })
        .eq('id', planId);

      if (error) {
        if (error.code === 'PGRST205') {
          console.warn("'diet_plans' tablosu bulunamadı. Aktiflik güncellemesi atlandı (fallback).");
          return;
        }
        throw error;
      }
    } catch (error: any) {
      console.error('Plan aktiflik durumu değiştirme hatası:', error);
      throw new Error('Plan durumu değiştirilemedi');
    }
  }

  /**
   * Diyet planını sil
   */
  static async deletePlan(planId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('diet_plans')
        .delete()
        .eq('id', planId);

      if (error) {
        if (error.code === 'PGRST205') {
          console.warn("'diet_plans' tablosu bulunamadı. Silme işlemi atlandı (fallback).");
          return;
        }
        throw error;
      }
    } catch (error: any) {
      console.error('Plan silme hatası:', error);
      throw new Error('Plan silinemedi');
    }
  }

  /**
   * AI ile kişiselleştirilmiş plan oluştur
   */
  static async generatePersonalizedPlan(
    userId: string,
    userProfile: {
      age?: number;
      weight?: number;
      height?: number;
      gender?: 'male' | 'female';
      activityLevel?: 'low' | 'moderate' | 'high';
      goal?: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain';
      allergies?: string[];
      dislikes?: string[];
      targetCalories?: number;
      targetProtein?: number;
      targetCarbs?: number;
      targetFat?: number;
    }
  ): Promise<DietPlan> {
    try {
      // Yeni AI meal plan service'i kullan
      const mealPlanRequest = {
        userProfile: {
          uid: userId, // userId'yi uid olarak kullan
          email: 'user@example.com', // Varsayılan email
          name: 'User', // Varsayılan isim
          age: userProfile.age || 25,
          weight: userProfile.weight || 70,
          height: userProfile.height || 170,
          gender: userProfile.gender || 'male',
          activityLevel: userProfile.activityLevel || 'moderate',
          goal: userProfile.goal || 'maintenance',
          allergies: userProfile.allergies || [],
          dislikes: userProfile.dislikes || [],
          planType: 'free' as const, // Varsayılan plan tipi
          createdAt: new Date(),
          updatedAt: new Date()
        },
        goal: userProfile.goal || 'maintenance',
        duration: 7, // 7 günlük plan
        preferences: [],
        allergies: userProfile.allergies || [],
        restrictions: userProfile.dislikes || []
      };

      const generatedPlan = await AIMealPlanService.generateMealPlan(mealPlanRequest);

      // AI planını DietPlan formatına dönüştür
      const weeklyPlan: WeeklyPlan = {};
      
      // İngilizce gün isimlerini Türkçe'ye dönüştür
      const dayMapping: { [key: string]: string } = {
        'monday': 'pazartesi',
        'tuesday': 'sali',
        'wednesday': 'carsamba',
        'thursday': 'persembe',
        'friday': 'cuma',
        'saturday': 'cumartesi',
        'sunday': 'pazar'
      };
      
      Object.entries(generatedPlan.weekly_plan).forEach(([day, dayPlan]: [string, any]) => {
        // Güvenlik kontrolü: dayPlan'ın gerekli alanları olduğundan emin ol
        if (!dayPlan || typeof dayPlan !== 'object') {
          console.warn(`Invalid dayPlan for ${day}:`, dayPlan);
          return;
        }

        // İngilizce gün ismini Türkçe'ye dönüştür
        const turkishDay = dayMapping[day.toLowerCase()] || day;

        weeklyPlan[turkishDay] = {
          breakfast: Array.isArray(dayPlan.breakfast) ? dayPlan.breakfast.map((meal: any) => ({
            id: meal.id || Math.random().toString(36).substr(2, 9),
            name: meal.name || 'Bilinmeyen Yemek',
            description: meal.description || '',
            calories: meal.calories || 0,
            protein: meal.protein || 0,
            carbs: meal.carbs || 0,
            fat: meal.fat || 0,
            ingredients: meal.ingredients || [],
            instructions: meal.instructions || []
          })) : [],
          lunch: Array.isArray(dayPlan.lunch) ? dayPlan.lunch.map((meal: any) => ({
            id: meal.id || Math.random().toString(36).substr(2, 9),
            name: meal.name || 'Bilinmeyen Yemek',
            description: meal.description || '',
            calories: meal.calories || 0,
            protein: meal.protein || 0,
            carbs: meal.carbs || 0,
            fat: meal.fat || 0,
            ingredients: meal.ingredients || [],
            instructions: meal.instructions || []
          })) : [],
          dinner: Array.isArray(dayPlan.dinner) ? dayPlan.dinner.map((meal: any) => ({
            id: meal.id || Math.random().toString(36).substr(2, 9),
            name: meal.name || 'Bilinmeyen Yemek',
            description: meal.description || '',
            calories: meal.calories || 0,
            protein: meal.protein || 0,
            carbs: meal.carbs || 0,
            fat: meal.fat || 0,
            ingredients: meal.ingredients || [],
            instructions: meal.instructions || []
          })) : [],
          snacks: Array.isArray(dayPlan.snacks) ? dayPlan.snacks.map((meal: any) => ({
            id: meal.id || Math.random().toString(36).substr(2, 9),
            name: meal.name || 'Bilinmeyen Yemek',
            description: meal.description || '',
            calories: meal.calories || 0,
            protein: meal.protein || 0,
            carbs: meal.carbs || 0,
            fat: meal.fat || 0,
            ingredients: meal.ingredients || [],
            instructions: meal.instructions || []
          })) : []
        };
      });

      // Goal değerini güvenli bir şekilde validate et
      const validGoals: DietPlan['goal'][] = ['weight_loss', 'weight_gain', 'maintenance', 'muscle_gain'];
      const safeGoal = validGoals.includes(generatedPlan.goal as DietPlan['goal']) 
        ? generatedPlan.goal as DietPlan['goal']
        : userProfile.goal || 'maintenance';

      const planData: Omit<DietPlan, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        name: generatedPlan.name,
        goal: safeGoal,
        daily_calories: generatedPlan.daily_calories,
        daily_protein: generatedPlan.daily_protein,
        daily_carbs: generatedPlan.daily_carbs,
        daily_fat: generatedPlan.daily_fat,
        weekly_plan: weeklyPlan,
        is_active: true
      };

      return await this.createPlan(planData);
    } catch (error: any) {
      console.error('Kişiselleştirilmiş plan oluşturma hatası:', error);
      throw new Error('Kişiselleştirilmiş plan oluşturulamadı');
    }
  }

  /**
   * AI ile haftalık öğün planı oluştur
   */
  private static async generateWeeklyMealPlan(
    dailyCalories: number,
    protein: number,
    carbs: number,
    fat: number,
    allergies: string[],
    dislikes: string[]
  ): Promise<WeeklyPlan> {
    try {
      const prompt = `
        Günlük ${dailyCalories} kalori, ${protein}g protein, ${carbs}g karbonhidrat, ${fat}g yağ hedefli 
        7 günlük beslenme planı oluştur. 
        
        Alerjiler: ${allergies.join(', ') || 'Yok'}
        Sevmediği yiyecekler: ${dislikes.join(', ') || 'Yok'}
        
        Her gün için kahvaltı, öğle, akşam ve atıştırmalık öner.
        Türk mutfağını tercih et. JSON formatında döndür.
        
        Format:
        {
          "pazartesi": {
            "breakfast": [{"name": "...", "calories": 300, "protein": 15, "carbs": 40, "fat": 10}],
            "lunch": [...],
            "dinner": [...],
            "snacks": [...]
          },
          ...
        }
      `;

      const response = await AIVisionService.generateRecipe([prompt]);
      
      // Mock data döndür (AI response parse edilene kadar)
      return this.getMockWeeklyPlan();
    } catch (error) {
      console.error('AI plan oluşturma hatası:', error);
      return this.getMockWeeklyPlan();
    }
  }

  /**
   * Mock haftalık plan (AI entegrasyonu tamamlanana kadar)
   */
  private static getMockWeeklyPlan(): WeeklyPlan {
    const days = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi', 'pazar'];
    const plan: WeeklyPlan = {};

    days.forEach(day => {
      plan[day] = {
        breakfast: [
          { id: '1', name: 'Yulaf Ezmesi + Meyve', calories: 300, protein: 12, carbs: 45, fat: 8 }
        ],
        lunch: [
          { id: '2', name: 'Tavuk Salatası', calories: 400, protein: 35, carbs: 20, fat: 15 }
        ],
        dinner: [
          { id: '3', name: 'Balık + Sebze', calories: 350, protein: 30, carbs: 25, fat: 12 }
        ],
        snacks: [
          { id: '4', name: 'Yoğurt + Fındık', calories: 150, protein: 8, carbs: 10, fat: 8 }
        ]
      };
    });

    return plan;
  }

  /**
   * Günlük hedefleri hesapla
   */
  static calculateDailyTargets(plan: DietPlan) {
    return {
      calories: plan.daily_calories,
      protein: plan.daily_protein,
      carbs: plan.daily_carbs,
      fat: plan.daily_fat
    };
  }

  /**
   * Günün öğünlerini getir
   */
  static getTodayMeals(plan: DietPlan): DayPlan | null {
    console.log('=== getTodayMeals PLAN DEBUG ===');
    const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long' }).toLowerCase();
    console.log('Today from locale:', today);
    
    const dayMap: { [key: string]: string } = {
      'pazartesi': 'pazartesi',
      'salı': 'sali',
      'çarşamba': 'carsamba',
      'perşembe': 'persembe',
      'cuma': 'cuma',
      'cumartesi': 'cumartesi',
      'pazar': 'pazar'
    };

    const dayKey = dayMap[today];
    console.log('Mapped day key:', dayKey);
    console.log('Available plan days:', Object.keys(plan.weekly_plan));
    
    const dayPlan = plan.weekly_plan[dayKey];
    console.log('Found day plan:', dayPlan ? 'YES' : 'NO');
    if (dayPlan) {
      console.log('Day plan meals count:', {
        breakfast: dayPlan.breakfast?.length || 0,
        lunch: dayPlan.lunch?.length || 0,
        dinner: dayPlan.dinner?.length || 0,
        snacks: dayPlan.snacks?.length || 0
      });
    }
    console.log('=== END getTodayMeals PLAN DEBUG ===');
    
    return dayPlan || null;
  }

  /**
   * Belirli bir günün öğünlerini getir
   */
  static getDayMeals(plan: DietPlan, dayKey: string): DayPlan | null {
    return plan.weekly_plan[dayKey] || null;
  }

  /**
    * Plan için toplam kalori ve makro hesapla
    */
   static calculatePlanTotals(dayPlan: DayPlan) {
     let totalCalories = 0;
     let totalProtein = 0;
     let totalCarbs = 0;
     let totalFat = 0;

     Object.values(dayPlan).forEach((meals: MealPlan[]) => {
       meals.forEach((meal: MealPlan) => {
         totalCalories += meal.calories;
         totalProtein += meal.protein;
         totalCarbs += meal.carbs;
         totalFat += meal.fat;
       });
     });

     return {
       calories: totalCalories,
       protein: totalProtein,
       carbs: totalCarbs,
       fat: totalFat
     };
   }

  /**
   * Hedef türünü okunabilir metne çevir
   */
  static getGoalDisplayText(goal: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain'): string {
    const goalMap: { [key: string]: string } = {
      'weight_loss': 'Kilo Verme',
      'weight_gain': 'Kilo Alma',
      'maintenance': 'Kilo Koruma',
      'muscle_gain': 'Kas Kazanma'
    };
    return goalMap[goal] || goal;
  }

  /**
   * Öğün türünü okunabilir metne çevir
   */
  static getMealTypeDisplayText(mealType: string): string {
    const mealMap: { [key: string]: string } = {
      'breakfast': 'Kahvaltı',
      'lunch': 'Öğle Yemeği',
      'dinner': 'Akşam Yemeği',
      'snacks': 'Atıştırmalık'
    };
    return mealMap[mealType] || mealType;
  }

  /**
   * Haftalık plana yeni öğün ekle
   */
  static addMealToPlan(
    plan: DietPlan, 
    dayKey: string, 
    mealType: keyof DayPlan, 
    meal: MealPlan
  ): DietPlan {
    const updatedPlan = { ...plan };
    
    if (!updatedPlan.weekly_plan[dayKey]) {
      updatedPlan.weekly_plan[dayKey] = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: []
      };
    }

    updatedPlan.weekly_plan[dayKey][mealType].push(meal);
    return updatedPlan;
  }

  /**
   * Haftalık plandan öğün çıkar
   */
  static removeMealFromPlan(
    plan: DietPlan, 
    dayKey: string, 
    mealType: keyof DayPlan, 
    mealId: string
  ): DietPlan {
    const updatedPlan = { ...plan };
    
    if (updatedPlan.weekly_plan[dayKey] && updatedPlan.weekly_plan[dayKey][mealType]) {
      updatedPlan.weekly_plan[dayKey][mealType] = 
        updatedPlan.weekly_plan[dayKey][mealType].filter(meal => meal.id !== mealId);
    }

    return updatedPlan;
  }

  /**
   * Plan validasyonu
   */
  static validatePlan(plan: Partial<DietPlan>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!plan.name || plan.name.trim().length === 0) {
      errors.push('Plan adı gereklidir');
    }

    if (!plan.goal) {
      errors.push('Hedef seçimi gereklidir');
    }

    if (!plan.daily_calories || plan.daily_calories <= 0) {
      errors.push('Günlük kalori hedefi pozitif bir sayı olmalıdır');
    }

    if (!plan.daily_protein || plan.daily_protein <= 0) {
      errors.push('Günlük protein hedefi pozitif bir sayı olmalıdır');
    }

    if (!plan.daily_carbs || plan.daily_carbs <= 0) {
      errors.push('Günlük karbonhidrat hedefi pozitif bir sayı olmalıdır');
    }

    if (!plan.daily_fat || plan.daily_fat <= 0) {
      errors.push('Günlük yağ hedefi pozitif bir sayı olmalıdır');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}