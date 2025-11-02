import { supabase } from './supabase';

export interface HealthData {
  id?: string;
  user_id: string;
  date: string;
  calories_consumed: number;
  calories_burned?: number;
  water_intake: number; // ml cinsinden
  steps?: number;
  sleep_hours?: number;
  weight?: number; // kg cinsinden
  created_at?: string;
}

export class HealthDataService {
  /**
   * Bugünün sağlık verisini al
   */
  static async getTodayHealthData(userId: string): Promise<HealthData | null> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('health_data')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Bugünün sağlık verisi alınamadı:', error);
      return null;
    }
  }

  /**
   * Haftalık sağlık verilerini al
   */
  static async getWeeklyHealthData(userId: string): Promise<HealthData[]> {
    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('health_data')
        .select('*')
        .eq('user_id', userId)
        .gte('date', weekAgo.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Haftalık sağlık verisi alınamadı:', error);
      return [];
    }
  }

  /**
   * Sağlık verisi kaydet veya güncelle
   */
  static async saveHealthData(healthData: Partial<HealthData>): Promise<HealthData | null> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Bugünün verisi var mı kontrol et
      const existing = await this.getTodayHealthData(healthData.user_id!);

      if (existing) {
        // Güncelle
        const { data, error } = await supabase
          .from('health_data')
          .update({
            ...healthData,
            date: today,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Yeni kayıt
        const { data, error } = await supabase
          .from('health_data')
          .insert({
            ...healthData,
            date: today,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Sağlık verisi kaydedilemedi:', error);
      return null;
    }
  }

  /**
   * Su tüketimi güncelle
   */
  static async updateWaterIntake(userId: string, waterMl: number): Promise<boolean> {
    try {
      const today = await this.getTodayHealthData(userId);
      const currentWater = today?.water_intake || 0;

      await this.saveHealthData({
        user_id: userId,
        water_intake: currentWater + waterMl,
        calories_consumed: today?.calories_consumed || 0,
      });

      return true;
    } catch (error) {
      console.error('Su tüketimi güncellenemedi:', error);
      return false;
    }
  }

  /**
   * Adım sayısı güncelle
   */
  static async updateSteps(userId: string, steps: number): Promise<boolean> {
    try {
      const today = await this.getTodayHealthData(userId);

      await this.saveHealthData({
        user_id: userId,
        steps: steps,
        water_intake: today?.water_intake || 0,
        calories_consumed: today?.calories_consumed || 0,
      });

      return true;
    } catch (error) {
      console.error('Adım sayısı güncellenemedi:', error);
      return false;
    }
  }

  /**
   * Uyku süresi güncelle
   */
  static async updateSleepHours(userId: string, hours: number): Promise<boolean> {
    try {
      const today = await this.getTodayHealthData(userId);

      await this.saveHealthData({
        user_id: userId,
        sleep_hours: hours,
        water_intake: today?.water_intake || 0,
        calories_consumed: today?.calories_consumed || 0,
      });

      return true;
    } catch (error) {
      console.error('Uyku süresi güncellenemedi:', error);
      return false;
    }
  }

  /**
   * Kilo güncelle
   */
  static async updateWeight(userId: string, weight: number): Promise<boolean> {
    try {
      const today = await this.getTodayHealthData(userId);

      await this.saveHealthData({
        user_id: userId,
        weight: weight,
        water_intake: today?.water_intake || 0,
        calories_consumed: today?.calories_consumed || 0,
      });

      return true;
    } catch (error) {
      console.error('Kilo güncellenemedi:', error);
      return false;
    }
  }

  /**
   * Bugünün toplam kalorisini meals tablosundan hesapla
   */
  static async calculateTodayCalories(userId: string): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('meals')
        .select('total_calories')
        .eq('user_id', userId)
        .gte('created_at', today)
        .lt('created_at', tomorrowStr);

      if (error) throw error;

      const totalCalories = data?.reduce((sum, meal) => sum + meal.total_calories, 0) || 0;
      return totalCalories;
    } catch (error) {
      console.error('Kalori hesaplanamadı:', error);
      return 0;
    }
  }

  /**
   * Günlük hedefleri hesapla
   */
  static getDailyGoals() {
    return {
      water: 2000, // ml
      steps: 10000,
      sleep: 8, // saat
      calories: 2000, // kcal
    };
  }

  /**
   * İlerleme yüzdesini hesapla
   */
  static calculateProgress(current: number, goal: number): number {
    if (goal === 0) return 0;
    return Math.min(Math.round((current / goal) * 100), 100);
  }

  /**
   * Haftalık ortalama hesapla
   */
  static calculateWeeklyAverage(weeklyData: HealthData[], field: keyof HealthData): number {
    const values = weeklyData
      .map(d => d[field])
      .filter(v => v !== null && v !== undefined) as number[];

    if (values.length === 0) return 0;

    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / values.length);
  }

  /**
   * Grafik verisi formatla
   */
  static formatChartData(weeklyData: HealthData[], field: keyof HealthData) {
    const last7Days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayData = weeklyData.find(d => d.date === dateStr);
      const value = dayData?.[field] as number || 0;

      last7Days.push({
        date: dateStr,
        day: date.toLocaleDateString('tr-TR', { weekday: 'short' }),
        value: value,
      });
    }

    return last7Days;
  }
}
