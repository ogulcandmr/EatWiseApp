import { supabase } from './supabase';

export interface MealData {
  id?: string;
  user_id: string;
  name: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  portion?: string;
  created_at?: string;
}

export interface DailyTotal {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealCount: number;
}

export class MealService {
  /**
   * Yeni öğün ekle
   */
  static async addMeal(mealData: Omit<MealData, 'id' | 'created_at'>): Promise<MealData> {
    try {
      const { data, error } = await supabase
        .from('meals')
        .insert([{
          user_id: mealData.user_id,
          name: mealData.name,
          foods: [], // Şimdilik boş array, ileride food items eklenebilir
          total_calories: mealData.total_calories,
          total_protein: mealData.total_protein,
          total_carbs: mealData.total_carbs,
          total_fat: mealData.total_fat,
          meal_type: mealData.meal_type,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        total_calories: data.total_calories,
        total_protein: data.total_protein,
        total_carbs: data.total_carbs,
        total_fat: data.total_fat,
        meal_type: data.meal_type,
        created_at: data.created_at
      };
    } catch (error: any) {
      console.error('Öğün eklenirken hata:', error);
      throw new Error('Öğün eklenemedi');
    }
  }

  /**
   * Kullanıcının öğünlerini getir (tarih aralığına göre)
   */
  static async getMeals(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<MealData[]> {
    try {
      let query = supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(meal => ({
        id: meal.id,
        user_id: meal.user_id,
        name: meal.name,
        total_calories: meal.total_calories,
        total_protein: meal.total_protein,
        total_carbs: meal.total_carbs,
        total_fat: meal.total_fat,
        meal_type: meal.meal_type,
        created_at: meal.created_at
      }));
    } catch (error: any) {
      console.error('Öğünler getirilirken hata:', error);
      throw new Error('Öğünler getirilemedi');
    }
  }

  /**
   * Bugünün öğünlerini getir
   */
  static async getTodayMeals(userId: string): Promise<MealData[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getMeals(userId, today, tomorrow);
  }

  /**
   * Bu haftanın öğünlerini getir
   */
  static async getWeekMeals(userId: string): Promise<MealData[]> {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    return this.getMeals(userId, monday);
  }

  /**
   * Öğün sil
   */
  static async deleteMeal(mealId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Öğün silinirken hata:', error);
      throw new Error('Öğün silinemedi');
    }
  }

  /**
   * Öğün güncelle
   */
  static async updateMeal(
    mealId: string,
    updates: Partial<Omit<MealData, 'id' | 'user_id' | 'created_at'>>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('meals')
        .update(updates)
        .eq('id', mealId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Öğün güncellenirken hata:', error);
      throw new Error('Öğün güncellenemedi');
    }
  }

  /**
   * Günlük toplamları hesapla
   */
  static calculateDailyTotals(meals: MealData[]): DailyTotal {
    const totals = meals.reduce(
      (acc, meal) => ({
        totalCalories: acc.totalCalories + meal.total_calories,
        totalProtein: acc.totalProtein + meal.total_protein,
        totalCarbs: acc.totalCarbs + meal.total_carbs,
        totalFat: acc.totalFat + meal.total_fat,
        mealCount: acc.mealCount + 1
      }),
      {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        mealCount: 0
      }
    );

    return {
      date: new Date().toISOString().split('T')[0],
      ...totals
    };
  }

  /**
   * Haftalık günlük toplamları hesapla
   */
  static calculateWeeklyDailyTotals(meals: MealData[]): DailyTotal[] {
    const dailyMeals = new Map<string, MealData[]>();

    // Öğünleri günlere göre grupla
    meals.forEach(meal => {
      const date = meal.created_at?.split('T')[0] || '';
      if (!dailyMeals.has(date)) {
        dailyMeals.set(date, []);
      }
      dailyMeals.get(date)!.push(meal);
    });

    // Her gün için toplamları hesapla
    const dailyTotals: DailyTotal[] = [];
    dailyMeals.forEach((dayMeals, date) => {
      const totals = this.calculateDailyTotals(dayMeals);
      dailyTotals.push({ ...totals, date });
    });

    return dailyTotals.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Öğün tipine göre emoji getir
   */
  static getMealTypeEmoji(mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'): string {
    const emojis = {
      breakfast: '🌅',
      lunch: '🌞',
      dinner: '🌙',
      snack: '🍎'
    };
    return emojis[mealType];
  }

  /**
   * Öğün tipine göre Türkçe isim getir
   */
  static getMealTypeName(mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'): string {
    const names = {
      breakfast: 'Kahvaltı',
      lunch: 'Öğle Yemeği',
      dinner: 'Akşam Yemeği',
      snack: 'Atıştırmalık'
    };
    return names[mealType];
  }
}
