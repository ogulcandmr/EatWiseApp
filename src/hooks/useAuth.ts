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
      console.log('=== LOAD USER PROFILE DEBUG ===');
      console.log('Loading profile for userId:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('Profile load error:', error);
        // Eğer kullanıcı profili yoksa (PGRST116 hatası), yeni profil oluştur
        if (error.code === 'PGRST116') {
          console.log('Kullanıcı profili bulunamadı, yeni profil oluşturuluyor...');
          
          // Supabase auth'dan kullanıcı bilgilerini al
          const { data: authUser } = await supabase.auth.getUser();
          
          if (authUser.user) {
            console.log('Auth user found:', authUser.user.id, authUser.user.email);
            // Yeni profil oluştur
            const { data: newProfile, error: insertError } = await supabase
              .from('users')
              .insert([{
                id: userId,
                email: authUser.user.email,
                name: authUser.user.user_metadata?.name || 'Kullanıcı',
                plan_type: 'free',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }])
              .select()
              .single();

            if (insertError) {
              console.error('Yeni profil oluşturulamadı:', insertError);
              throw insertError;
            }

            console.log('New profile created:', newProfile);
            // Yeni oluşturulan profili kullan
            setUser({
              id: newProfile.id,
              email: newProfile.email,
              name: newProfile.name,
              age: newProfile.age,
              weight: newProfile.weight,
              height: newProfile.height,
              gender: newProfile.gender,
              activityLevel: newProfile.activity_level,
              goal: newProfile.goal,
              allergies: newProfile.allergies || [],
              dislikes: newProfile.dislikes || [],
              planType: newProfile.plan_type
            });
            console.log('User set with new profile');
            return;
          }
        }
        throw error;
      }

      console.log('Profile loaded successfully:', data);
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
      console.log('User set with existing profile');
      console.log('=== END LOAD USER PROFILE DEBUG ===');
    } catch (error) {
      console.error('Profil getirilirken hata:', error);
      setUser(null);
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