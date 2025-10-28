import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAppStore } from '../store/useAppStore';

import { User } from '../types/types';

export const useAuth = () => {
  const [loading, setLoading] = useState(true);
  const { user, setUser, isAuthenticated } = useAppStore();

  useEffect(() => {
    // Mevcut oturumu kontrol et
    checkSession();

    // Auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Session kontrol hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setUser({
        id: data.id,
        email: data.email,
        name: data.name,
        age: data.age,
        weight: data.weight,
        height: data.height,
        gender: data.gender,
        activityLevel: data.activity_level,
        goal: data.goal,
        allergies: data.allergies || [],
        dislikes: data.dislikes || [],
        planType: data.plan_type
      });
    } catch (error) {
      console.error('Kullanıcı profili yüklenemedi:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        // Kullanıcı profilini oluştur
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email,
            name,
            plan_type: 'free',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (profileError) throw profileError;
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return { success: false, error: 'Kullanıcı oturumu bulunamadı' };

    try {
      setLoading(true);
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setUser({ ...user, ...updates });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    loadUserProfile
  };
};