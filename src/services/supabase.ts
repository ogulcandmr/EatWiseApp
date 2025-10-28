// Supabase konfigürasyonu
import { createClient } from '@supabase/supabase-js';

// Supabase konfigürasyonu (şimdilik mock verilerle çalışacak)
const supabaseUrl = 'https://iwkrncptlrfyisanvuqg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3a3JuY3B0bHJmeWlzYW52dXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NjAzMTEsImV4cCI6MjA3NjIzNjMxMX0.Las3DaeoAhV0_9IvvZSvZLDR2ZSlTWFbFIQD7lxRfXM';

// Supabase client oluştur
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Veritabanı tabloları için tip tanımları
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          age?: number;
          weight?: number;
          height?: number;
          gender?: 'male' | 'female';
          activity_level?: 'low' | 'moderate' | 'high';
          goal?: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain';
          allergies?: string[];
          dislikes?: string[];
          plan_type: 'free' | 'pro';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          age?: number;
          weight?: number;
          height?: number;
          gender?: 'male' | 'female';
          activity_level?: 'low' | 'moderate' | 'high';
          goal?: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain';
          allergies?: string[];
          dislikes?: string[];
          plan_type?: 'free' | 'pro';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          age?: number;
          weight?: number;
          height?: number;
          gender?: 'male' | 'female';
          activity_level?: 'low' | 'moderate' | 'high';
          goal?: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain';
          allergies?: string[];
          dislikes?: string[];
          plan_type?: 'free' | 'pro';
          updated_at?: string;
        };
      };
      meals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          foods: any[];
          total_calories: number;
          total_protein: number;
          total_carbs: number;
          total_fat: number;
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          foods: any[];
          total_calories: number;
          total_protein: number;
          total_carbs: number;
          total_fat: number;
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          foods?: any[];
          total_calories?: number;
          total_protein?: number;
          total_carbs?: number;
          total_fat?: number;
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
        };
      };
      health_data: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          calories_consumed: number;
          calories_burned?: number;
          water_intake: number;
          steps?: number;
          sleep_hours?: number;
          weight?: number;
          created_at: string;
        };
        Insert: {
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
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          calories_consumed?: number;
          calories_burned?: number;
          water_intake?: number;
          steps?: number;
          sleep_hours?: number;
          weight?: number;
        };
      };
    };
  };
}