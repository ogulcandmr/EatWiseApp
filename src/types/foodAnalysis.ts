export interface FoodItem {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  confidence?: number;
}

export interface FoodAnalysisResult {
  items: FoodItem[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  portion: string;
  imageUrl?: string;
  analysisType: 'mock' | 'ai';
}
