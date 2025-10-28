export type RecipeMode = 'normal' | 'fit' | 'vegan' | 'kas-yapıcı';

export interface Recipe {
  title: string;
  time: string;
  ingredients: string[];
  steps: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface RecipeGenerationRequest {
  ingredients: string[];
  mode?: RecipeMode;
}

export interface RecipeGenerationResponse {
  recipes: Recipe[];
}
