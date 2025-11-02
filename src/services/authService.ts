// Supabase Authentication servisi
import { supabase } from './supabase';
import { UserProfile } from '../types/types';
export class AuthService {
  // Kullanıcı kaydı
  static async register(email: string, password: string, name: string): Promise<UserProfile> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Kullanıcı profilini oluştur
        const userProfile: UserProfile = {
          uid: data.user.id,
          email: data.user.email!,
          name,
          planType: 'free',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Veritabanında kullanıcı profilini oluştur
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            name,
            plan_type: 'free',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (profileError) throw profileError;

        return userProfile;
      }

      throw new Error('Kullanıcı oluşturulamadı');
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.message));
    }
  }

  // Kullanıcı girişi
  static async login(email: string, password: string): Promise<UserProfile> {
    try {
      // Debug: Login öncesi session kontrolü
      console.log('=== LOGIN DEBUG ===');
      const { data: { session: oldSession } } = await supabase.auth.getSession();
      console.log('Login öncesi session:', oldSession?.user?.id);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Debug: Login sonrası session kontrolü
      console.log('Login sonrası user_id:', data.user?.id);
      console.log('Login email:', email);
      console.log('=== END LOGIN DEBUG ===');

      if (data.user) {
        // Kullanıcı profilini getir
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        return {
          uid: profileData.id,
          email: profileData.email,
          name: profileData.name,
          age: profileData.age,
          weight: profileData.weight,
          height: profileData.height,
          gender: profileData.gender,
          activityLevel: profileData.activity_level,
          goal: profileData.goal,
          allergies: profileData.allergies,
          dislikes: profileData.dislikes,
          planType: profileData.plan_type,
          createdAt: new Date(profileData.created_at),
          updatedAt: new Date(profileData.updated_at)
        };
      }

      throw new Error('Giriş yapılamadı');
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.message));
    }
  }

  // Kullanıcı çıkışı
  static async logout(): Promise<void> {
    try {
      // Session'ı tamamen temizle
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      // Debug: Logout sonrası session kontrolü
      console.log('=== LOGOUT DEBUG ===');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Logout sonrası session:', session);
      console.log('=== END LOGOUT DEBUG ===');
    } catch (error: any) {
      throw new Error('Çıkış yapılırken hata oluştu');
    }
  }

  // Auth state değişikliklerini dinle
  static onAuthStateChanged(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  }

  // Kullanıcı profilini güncelle
  static async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name) updateData.name = updates.name;
      if (updates.age) updateData.age = updates.age;
      if (updates.weight) updateData.weight = updates.weight;
      if (updates.height) updateData.height = updates.height;
      if (updates.gender) updateData.gender = updates.gender;
      if (updates.activityLevel) updateData.activity_level = updates.activityLevel;
      if (updates.goal) updateData.goal = updates.goal;
      if (updates.allergies) updateData.allergies = updates.allergies;
      if (updates.dislikes) updateData.dislikes = updates.dislikes;
      if (updates.planType) updateData.plan_type = updates.planType;

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', uid);

      if (error) throw error;
    } catch (error: any) {
      throw new Error('Profil güncellenirken hata oluştu');
    }
  }

  // Kullanıcı profilini getir
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single();

      if (error) throw error;

      return {
        uid: data.id,
        email: data.email,
        name: data.name,
        age: data.age,
        weight: data.weight,
        height: data.height,
        gender: data.gender,
        activityLevel: data.activity_level,
        goal: data.goal,
        allergies: data.allergies,
        dislikes: data.dislikes,
        planType: data.plan_type,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error: any) {
      console.error('Profil getirilirken hata:', error);
      return null;
    }
  }

  // Mevcut kullanıcıyı getir
  static async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      return null;
    }
  }

  // Hata mesajlarını Türkçe'ye çevir
  private static getErrorMessage(errorMessage: string): string {
    if (errorMessage.includes('email already registered')) {
      return 'Bu e-posta adresi zaten kullanımda';
    }
    if (errorMessage.includes('weak password')) {
      return 'Şifre çok zayıf. En az 6 karakter olmalı';
    }
    if (errorMessage.includes('invalid email')) {
      return 'Geçersiz e-posta adresi';
    }
    if (errorMessage.includes('Invalid login credentials')) {
      return 'E-posta veya şifre hatalı';
    }
    if (errorMessage.includes('too many requests')) {
      return 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin';
    }
    return 'Bir hata oluştu. Lütfen tekrar deneyin';
  }
}