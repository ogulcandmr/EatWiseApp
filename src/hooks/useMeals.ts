import { useState, useEffect } from 'react';
import { MealService, MealData } from '../services/mealService';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from './useAuth';

export const useMeals = () => {
  const [meals, setMeals] = useState<MealData[]>([]);
  const [todayMeals, setTodayMeals] = useState<MealData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { setLoading: setGlobalLoading, setError: setGlobalError } = useAppStore();

  // Bugünün öğünlerini yükle
  const loadTodayMeals = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      setGlobalLoading(true);

      const meals = await MealService.getTodayMeals(user.id);
      setTodayMeals(meals);
    } catch (err: any) {
      const errorMessage = 'Bugünün öğünleri yüklenemedi';
      setError(errorMessage);
      setGlobalError(errorMessage);
      console.error('Today meals error:', err);
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  // Haftalık öğünleri yükle
  const loadWeekMeals = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const meals = await MealService.getWeekMeals(user.id);
      setMeals(meals);
    } catch (err: any) {
      const errorMessage = 'Haftalık öğünler yüklenemedi';
      setError(errorMessage);
      console.error('Week meals error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Öğün ekle
  const addMeal = async (mealData: Omit<MealData, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) {
      setError('Kullanıcı oturumu bulunamadı');
      return { success: false };
    }

    try {
      setLoading(true);
      setError(null);

      const newMeal = await MealService.addMeal({
        ...mealData,
        user_id: user.id
      });

      // Local state'i güncelle
      setTodayMeals(prev => [...prev, newMeal]);
      setMeals(prev => [...prev, newMeal]);

      return { success: true, meal: newMeal };
    } catch (err: any) {
      const errorMessage = 'Öğün eklenemedi';
      setError(errorMessage);
      console.error('Add meal error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Öğün sil
  const deleteMeal = async (mealId: string) => {
    try {
      setLoading(true);
      setError(null);

      await MealService.deleteMeal(mealId);

      // Local state'i güncelle
      setTodayMeals(prev => prev.filter(meal => meal.id !== mealId));
      setMeals(prev => prev.filter(meal => meal.id !== mealId));

      return { success: true };
    } catch (err: any) {
      const errorMessage = 'Öğün silinemedi';
      setError(errorMessage);
      console.error('Delete meal error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Öğün güncelle
  const updateMeal = async (
    mealId: string, 
    updates: Partial<Omit<MealData, 'id' | 'user_id' | 'created_at'>>
  ) => {
    try {
      setLoading(true);
      setError(null);

      await MealService.updateMeal(mealId, updates);

      // Local state'i güncelle
      const updateMealInArray = (meals: MealData[]) =>
        meals.map(meal => meal.id === mealId ? { ...meal, ...updates } : meal);

      setTodayMeals(updateMealInArray);
      setMeals(updateMealInArray);

      return { success: true };
    } catch (err: any) {
      const errorMessage = 'Öğün güncellenemedi';
      setError(errorMessage);
      console.error('Update meal error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Günlük toplam hesapla
  const getTodayTotals = () => {
    return MealService.calculateDailyTotals(todayMeals);
  };

  // Haftalık günlük toplamları hesapla
  const getWeeklyTotals = () => {
    return MealService.calculateWeeklyDailyTotals(meals);
  };

  // Component mount olduğunda bugünün öğünlerini yükle
  useEffect(() => {
    if (user) {
      loadTodayMeals();
    }
  }, [user]);

  return {
    meals,
    todayMeals,
    loading,
    error,
    loadTodayMeals,
    loadWeekMeals,
    addMeal,
    deleteMeal,
    updateMeal,
    getTodayTotals,
    getWeeklyTotals,
    refresh: loadTodayMeals
  };
};