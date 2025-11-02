import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { PlanService, DietPlan } from '../services/planService';
import { useAuth } from './useAuth';

interface UsePlansReturn {
  // State
  plans: DietPlan[];
  activePlan: DietPlan | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadPlans: () => Promise<void>;
  createPlan: (planData: Omit<DietPlan, 'id' | 'created_at' | 'updated_at'>) => Promise<DietPlan | null>;
  updatePlan: (planId: string, updates: Partial<DietPlan>) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  activatePlan: (planId: string) => Promise<void>;
  generateAIPlan: (userProfile: any) => Promise<DietPlan | null>;
  
  // Computed values
  pastPlans: DietPlan[];
  totalPlans: number;
}

export const usePlans = (): UsePlansReturn => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [activePlan, setActivePlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all plans for the current user
  const loadPlans = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [allPlans, activeUserPlan] = await Promise.all([
        PlanService.getUserPlans(user.id),
        PlanService.getActivePlan(user.id)
      ]);
      
      setPlans(allPlans);
      setActivePlan(activeUserPlan);
    } catch (err: any) {
      const errorMessage = err?.message || 'Planlar yüklenemedi';
      setError(errorMessage);
      console.error('usePlans - loadPlans error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Create a new plan
  const createPlan = useCallback(async (
    planData: Omit<DietPlan, 'id' | 'created_at' | 'updated_at'>
  ): Promise<DietPlan | null> => {
    if (!user?.id) {
      setError('Kullanıcı oturumu bulunamadı');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const newPlan = await PlanService.createPlan(planData);
      
      // Refresh plans after creation
      await loadPlans();
      
      return newPlan;
    } catch (err: any) {
      const errorMessage = err?.message || 'Plan oluşturulamadı';
      setError(errorMessage);
      console.error('usePlans - createPlan error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadPlans]);

  // Update an existing plan
  const updatePlan = useCallback(async (
    planId: string, 
    updates: Partial<DietPlan>
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await PlanService.updatePlan(planId, updates);
      
      // Refresh plans after update
      await loadPlans();
    } catch (err: any) {
      const errorMessage = err?.message || 'Plan güncellenemedi';
      setError(errorMessage);
      console.error('usePlans - updatePlan error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPlans]);

  // Delete a plan
  const deletePlan = useCallback(async (planId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await PlanService.deletePlan(planId);
      
      // Refresh plans after deletion
      await loadPlans();
    } catch (err: any) {
      const errorMessage = err?.message || 'Plan silinemedi';
      setError(errorMessage);
      console.error('usePlans - deletePlan error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPlans]);

  // Activate a plan (deactivate others)
  const activatePlan = useCallback(async (planId: string): Promise<void> => {
    if (!user?.id) {
      setError('Kullanıcı oturumu bulunamadı');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await PlanService.togglePlanActive(planId, user.id);
      
      // Refresh plans after activation
      await loadPlans();
    } catch (err: any) {
      const errorMessage = err?.message || 'Plan aktifleştirilemedi';
      setError(errorMessage);
      console.error('usePlans - activatePlan error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadPlans]);

  // Generate AI-based personalized plan
  const generateAIPlan = useCallback(async (userProfile: any): Promise<DietPlan | null> => {
    if (!user?.id) {
      setError('Kullanıcı oturumu bulunamadı');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const aiPlan = await PlanService.generatePersonalizedPlan(user.id, userProfile);
      
      // Refresh plans after AI generation
      await loadPlans();
      
      return aiPlan;
    } catch (err: any) {
      const errorMessage = err?.message || 'AI plan oluşturulamadı';
      setError(errorMessage);
      console.error('usePlans - generateAIPlan error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadPlans]);

  // Load plans when user changes
  useEffect(() => {
    if (user?.id) {
      loadPlans();
    } else {
      setPlans([]);
      setActivePlan(null);
    }
  }, [user?.id, loadPlans]);

  // Computed values
  const pastPlans = plans.filter(plan => !plan.is_active);
  const totalPlans = plans.length;

  return {
    // State
    plans,
    activePlan,
    loading,
    error,
    
    // Actions
    loadPlans,
    createPlan,
    updatePlan,
    deletePlan,
    activatePlan,
    generateAIPlan,
    
    // Computed values
    pastPlans,
    totalPlans,
  };
};