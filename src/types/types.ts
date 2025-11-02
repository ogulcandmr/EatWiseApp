// Temel tip tanımları
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: 'male' | 'female';
  activityLevel?: 'low' | 'moderate' | 'high';
  goal?: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain';
  allergies?: string[];
  dislikes?: string[];
  planType: 'free' | 'pro';
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: 'male' | 'female';
  activityLevel?: 'low' | 'moderate' | 'high';
  goal?: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain';
  allergies?: string[];
  dislikes?: string[];
  planType: 'free' | 'pro';
}

export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  servingSize: string;
  imageUrl?: string;
}

export interface Meal {
  id: string;
  name: string;
  foods: Food[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  timestamp: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number; // dakika
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  imageUrl?: string;
}

export interface DietPlan {
  id: string;
  userId: string;
  name: string;
  goal: string;
  dailyCalories: number;
  weeklyPlan: {
    [key: string]: {
      breakfast: Recipe[];
      lunch: Recipe[];
      dinner: Recipe[];
      snacks: Recipe[];
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthData {
  date: string;
  caloriesConsumed: number;
  caloriesBurned?: number;
  waterIntake: number; // ml
  steps?: number;
  sleepHours?: number;
  weight?: number;
}

export interface AIAnalysis {
  foods: Array<{
    name: string;
    confidence: number;
    estimatedAmount: string;
    calories: number;
  }>;
  totalCalories: number;
  suggestions: string[];
  healthScore: number;
}

export interface RootStackParamList {
  Auth: undefined;
  Main: undefined;
  Camera: undefined;
  RecipeDetail: { recipe: Recipe };
  Profile: undefined;
  EditPlan: undefined;
  IngredientsToRecipe: {
    initialIngredients?: string;
    mealData?: {
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  };
  [key: string]: object | undefined;
}

export type MainTabParamList = {
  Home: undefined;
  Camera: undefined;
  Recipes: undefined;
  Plan: undefined;
  Tracking: undefined;
  [key: string]: object | undefined;
};
