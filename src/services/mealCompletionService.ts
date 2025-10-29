import { supabase } from './supabase';

export interface MealCompletion {
  id?: string;
  user_id: string;
  plan_id: string;
  completion_date: string;
  day_of_week: string; // 'pazartesi', 'sali', etc.
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  meal_id: string;
  completed_at?: string;
  created_at?: string;
}

export class MealCompletionService {
  /**
   * Öğün tamamlama durumunu kaydet/güncelle
   */
  static async toggleMealCompletion(
    userId: string,
    planId: string,
    dayOfWeek: string,
    mealType: string,
    mealId: string
  ): Promise<MealCompletion | null> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Mevcut kaydı kontrol et
      const { data: existing, error: fetchError } = await supabase
        .from('meal_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('plan_id', planId)
        .eq('completion_date', today)
        .eq('day_of_week', dayOfWeek)
        .eq('meal_type', mealType)
        .eq('meal_id', mealId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        // Mevcut kayıt varsa toggle yap
        const isCurrentlyCompleted = existing.completed_at !== null;
        const { data, error } = await supabase
          .from('meal_completions')
          .update({
            completed_at: isCurrentlyCompleted ? null : new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Yeni kayıt - tamamlandı olarak işaretle
        const { data, error } = await supabase
          .from('meal_completions')
          .insert({
            user_id: userId,
            plan_id: planId,
            completion_date: today,
            day_of_week: dayOfWeek,
            meal_type: mealType,
            meal_id: mealId,
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Öğün tamamlama durumu kaydedilemedi:', error);
      return null;
    }
  }

  /**
   * Belirli bir gün için tamamlanan öğünleri al
   */
  static async getDayCompletions(
    userId: string,
    planId: string,
    dayOfWeek: string,
    date?: string
  ): Promise<MealCompletion[]> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];

      console.log('=== GET DAY COMPLETIONS DEBUG ===');
      console.log('userId:', userId);
      console.log('planId:', planId);
      console.log('dayOfWeek:', dayOfWeek);
      console.log('targetDate:', targetDate);

      const { data, error } = await supabase
        .from('meal_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('plan_id', planId)
        .eq('completion_date', targetDate)
        .eq('day_of_week', dayOfWeek)
        .not('completed_at', 'is', null);

      console.log('Query result - data:', data);
      console.log('Query result - error:', error);
      console.log('=== END GET DAY COMPLETIONS DEBUG ===');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Gün tamamlamaları alınamadı:', error);
      return [];
    }
  }

  /**
   * Belirli bir öğünün tamamlanma durumunu kontrol et
   */
  static async isMealCompleted(
    userId: string,
    planId: string,
    dayOfWeek: string,
    mealType: string,
    mealId: string,
    date?: string
  ): Promise<boolean> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('meal_completions')
        .select('completed_at')
        .eq('user_id', userId)
        .eq('plan_id', planId)
        .eq('completion_date', targetDate)
        .eq('day_of_week', dayOfWeek)
        .eq('meal_type', mealType)
        .eq('meal_id', mealId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data?.completed_at !== null;
    } catch (error) {
      console.error('Öğün tamamlama durumu kontrol edilemedi:', error);
      return false;
    }
  }

  /**
   * Haftalık tamamlama istatistiklerini al
   */
  static async getWeeklyCompletionStats(
    userId: string,
    planId: string
  ): Promise<{ [key: string]: number }> {
    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('meal_completions')
        .select('completion_date, completed_at')
        .eq('user_id', userId)
        .eq('plan_id', planId)
        .not('completed_at', 'is', null)
        .gte('completion_date', weekAgo.toISOString().split('T')[0])
        .lte('completion_date', today.toISOString().split('T')[0]);

      if (error) throw error;

      // Günlere göre grupla
      const stats: { [key: string]: number } = {};
      data?.forEach((completion) => {
        const date = completion.completion_date;
        stats[date] = (stats[date] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Haftalık tamamlama istatistikleri alınamadı:', error);
      return {};
    }
  }

  /**
   * Günlük tamamlama yüzdesini hesapla
   */
  static async getDailyCompletionPercentage(
    userId: string,
    planId: string,
    dayOfWeek: string,
    totalMealsCount: number,
    date?: string
  ): Promise<number> {
    try {
      const completions = await this.getDayCompletions(userId, planId, dayOfWeek, date);
      return totalMealsCount > 0 ? (completions.length / totalMealsCount) * 100 : 0;
    } catch (error) {
      console.error('Günlük tamamlama yüzdesi hesaplanamadı:', error);
      return 0;
    }
  }
}