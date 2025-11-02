import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

export interface HealthDataEntry {
  id?: string;
  user_id: string;
  date: string;
  calories_consumed: number;
  calories_burned?: number;
  water_intake: number;
  steps?: number;
  sleep_hours?: number;
  weight?: number;
  created_at?: string;
}

export const useHealthData = () => {
  const [healthData, setHealthData] = useState<HealthDataEntry[]>([]);
  const [todayData, setTodayData] = useState<HealthDataEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Bugünün sağlık verilerini yükle
  const loadTodayHealthData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('health_data')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      setTodayData(data || null);
    } catch (err: any) {
      console.error('Today health data error:', err);
      setError('Bugünün sağlık verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Haftalık sağlık verilerini yükle
  const loadWeekHealthData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('health_data')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', weekAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      setHealthData(data || []);
    } catch (err: any) {
      console.error('Week health data error:', err);
      setError('Haftalık sağlık verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Sağlık verisi ekle veya güncelle
  const updateHealthData = async (data: Partial<Omit<HealthDataEntry, 'id' | 'user_id' | 'created_at'>>) => {
    if (!user) {
      setError('Kullanıcı oturumu bulunamadı');
      return { success: false };
    }

    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];
      
      // Bugünün verisi var mı kontrol et
      const { data: existingData } = await supabase
        .from('health_data')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      let result;
      
      if (existingData) {
        // Güncelle
        result = await supabase
          .from('health_data')
          .update(data)
          .eq('id', existingData.id)
          .select()
          .single();
      } else {
        // Yeni kayıt oluştur
        result = await supabase
          .from('health_data')
          .insert([{
            user_id: user.id,
            date: today,
            calories_consumed: 0,
            water_intake: 0,
            ...data,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setTodayData(result.data);
      
      // Haftalık verileri de güncelle
      setHealthData(prev => {
        const filtered = prev.filter(item => item.date !== today);
        return [...filtered, result.data].sort((a, b) => a.date.localeCompare(b.date));
      });

      return { success: true, data: result.data };
    } catch (err: any) {
      const errorMessage = 'Sağlık verileri güncellenemedi';
      setError(errorMessage);
      console.error('Update health data error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Su tüketimi güncelle
  const updateWaterIntake = async (amount: number) => {
    return updateHealthData({ water_intake: amount });
  };

  // Adım sayısı güncelle
  const updateSteps = async (steps: number) => {
    return updateHealthData({ steps });
  };

  // Uyku saati güncelle
  const updateSleep = async (hours: number) => {
    return updateHealthData({ sleep_hours: hours });
  };

  // Kilo güncelle
  const updateWeight = async (weight: number) => {
    return updateHealthData({ weight });
  };

  // Kalori güncelle
  const updateCalories = async (consumed: number, burned?: number) => {
    return updateHealthData({ 
      calories_consumed: consumed,
      ...(burned !== undefined && { calories_burned: burned })
    });
  };

  // Haftalık ortalamalar hesapla
  const getWeeklyAverages = () => {
    if (healthData.length === 0) {
      return {
        avgCalories: 0,
        avgWater: 0,
        avgSteps: 0,
        avgSleep: 0
      };
    }

    const totals = healthData.reduce((acc, day) => ({
      calories: acc.calories + day.calories_consumed,
      water: acc.water + day.water_intake,
      steps: acc.steps + (day.steps || 0),
      sleep: acc.sleep + (day.sleep_hours || 0)
    }), { calories: 0, water: 0, steps: 0, sleep: 0 });

    const count = healthData.length;

    return {
      avgCalories: Math.round(totals.calories / count),
      avgWater: Math.round(totals.water / count),
      avgSteps: Math.round(totals.steps / count),
      avgSleep: Math.round((totals.sleep / count) * 10) / 10
    };
  };

  // Component mount olduğunda bugünün verilerini yükle
  useEffect(() => {
    if (user) {
      loadTodayHealthData();
      loadWeekHealthData();
    }
  }, [user]);

  return {
    healthData,
    todayData,
    loading,
    error,
    loadTodayHealthData,
    loadWeekHealthData,
    updateHealthData,
    updateWaterIntake,
    updateSteps,
    updateSleep,
    updateWeight,
    updateCalories,
    getWeeklyAverages,
    refresh: loadTodayHealthData
  };
};