import { supabase } from './supabase';

export interface RecipeDb {
  id: string;
  title: string;
  cuisine: string; // Türk, İtalyan, Çin, vb.
  diet_type: string; // normal, vegan, vegetarian, keto, low-carb
  time_minutes: number;
  ingredients: string[]; // JSONB array
  steps: string[]; // JSONB array
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  image_url?: string;
  created_at?: string;
}

export interface UserFavorite {
  id?: string;
  user_id: string;
  recipe_id: string;
  created_at?: string;
}

export interface RecipeFilter {
  cuisine?: string;
  diet_type?: string;
  max_time?: number;
  search?: string;
  ingredient?: string;
}

export class RecipeDbService {
  /**
   * Tüm tarifleri getir (filtreyle)
   */
  static async getRecipes(filter?: RecipeFilter): Promise<RecipeDb[]> {
    try {
      let query = supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtreler
      if (filter?.cuisine) {
        query = query.eq('cuisine', filter.cuisine);
      }

      if (filter?.diet_type) {
        query = query.eq('diet_type', filter.diet_type);
      }

      if (filter?.max_time) {
        query = query.lte('time_minutes', filter.max_time);
      }

      if (filter?.search) {
        query = query.ilike('title', `%${filter.search}%`);
      }

      // Malzeme filtresi (JSONB array içinde arama)
      if (filter?.ingredient) {
        query = query.contains('ingredients', [filter.ingredient]);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Tarifler getirilemedi:', error);
      return this.getMockRecipes(filter);
    }
  }

  /**
   * Tek tarif getir
   */
  static async getRecipe(id: string): Promise<RecipeDb | null> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Tarif getirilemedi:', error);
      return null;
    }
  }

  /**
   * Favorilere ekle
   */
  static async addToFavorites(userId: string, recipeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users_favorites')
        .insert({
          user_id: userId,
          recipe_id: recipeId,
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Favorilere eklenemedi:', error);
      return false;
    }
  }

  /**
   * Favorilerden çıkar
   */
  static async removeFromFavorites(userId: string, recipeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('recipe_id', recipeId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Favorilerden çıkarılamadı:', error);
      return false;
    }
  }

  /**
   * Kullanıcının favorilerini getir
   */
  static async getUserFavorites(userId: string): Promise<RecipeDb[]> {
    try {
      const { data, error } = await supabase
        .from('users_favorites')
        .select('recipe_id, recipes(*)')
        .eq('user_id', userId);

      if (error) throw error;

      return data?.map((item: any) => item.recipes) || [];
    } catch (error) {
      console.error('Favoriler getirilemedi:', error);
      return [];
    }
  }

  /**
   * Tarif favoride mi kontrol et
   */
  static async isFavorite(userId: string, recipeId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('recipe_id', recipeId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Mutfak türlerini getir
   */
  static getCuisineTypes(): string[] {
    return ['Tümü', 'Türk', 'İtalyan', 'Çin', 'Japon', 'Meksika', 'Hint', 'Akdeniz'];
  }

  /**
   * Diyet tiplerini getir
   */
  static getDietTypes(): string[] {
    return ['Tümü', 'Normal', 'Vegan', 'Vejetaryen', 'Keto', 'Düşük Karbonhidrat', 'Glutensiz'];
  }

  /**
   * Süre filtrelerini getir
   */
  static getTimeFilters(): { label: string; value: number | null }[] {
    return [
      { label: 'Tümü', value: null },
      { label: '15 dk', value: 15 },
      { label: '30 dk', value: 30 },
      { label: '45 dk', value: 45 },
      { label: '60 dk', value: 60 },
    ];
  }

  /**
   * Mock tarifler (fallback)
   */
  private static getMockRecipes(filter?: RecipeFilter): RecipeDb[] {
    const mockRecipes: RecipeDb[] = [
      {
        id: '1',
        title: 'Yumurtalı Omlet',
        cuisine: 'Türk',
        diet_type: 'Normal',
        time_minutes: 10,
        ingredients: ['2 yumurta', '1 domates', '1 biber', 'Tuz', 'Karabiber'],
        steps: [
          'Yumurtaları çırpın',
          'Domates ve biberi doğrayın',
          'Tavada pişirin',
          'Servis yapın'
        ],
        calories: 220,
        protein: 14,
        carbs: 8,
        fats: 15,
      },
      {
        id: '2',
        title: 'Vegan Buddha Bowl',
        cuisine: 'Akdeniz',
        diet_type: 'Vegan',
        time_minutes: 25,
        ingredients: ['Kinoa', 'Nohut', 'Avokado', 'Domates', 'Salatalık', 'Limon'],
        steps: [
          'Kinoayı haşlayın',
          'Nohutları fırınlayın',
          'Sebzeleri doğrayın',
          'Kasede birleştirin'
        ],
        calories: 380,
        protein: 12,
        carbs: 45,
        fats: 18,
      },
      {
        id: '3',
        title: 'Tavuk Göğsü Izgara',
        cuisine: 'Türk',
        diet_type: 'Düşük Karbonhidrat',
        time_minutes: 20,
        ingredients: ['Tavuk göğsü', 'Zeytinyağı', 'Baharatlar', 'Limon'],
        steps: [
          'Tavuğu marine edin',
          'Izgarada pişirin',
          'Dinlendirin',
          'Servis yapın'
        ],
        calories: 165,
        protein: 31,
        carbs: 0,
        fats: 3.6,
      },
      {
        id: '4',
        title: 'Makarna Carbonara',
        cuisine: 'İtalyan',
        diet_type: 'Normal',
        time_minutes: 30,
        ingredients: ['Spagetti', 'Yumurta', 'Parmesan', 'Pancetta', 'Karabiber'],
        steps: [
          'Makarnayı haşlayın',
          'Pancetta\'yı kızartın',
          'Yumurta sosunu hazırlayın',
          'Karıştırıp servis yapın'
        ],
        calories: 520,
        protein: 22,
        carbs: 58,
        fats: 22,
      },
      {
        id: '5',
        title: 'Somon Izgara',
        cuisine: 'Akdeniz',
        diet_type: 'Keto',
        time_minutes: 15,
        ingredients: ['Somon fileto', 'Limon', 'Dereotu', 'Zeytinyağı'],
        steps: [
          'Somonu marine edin',
          'Izgarada pişirin',
          'Limon sıkın',
          'Servis yapın'
        ],
        calories: 280,
        protein: 34,
        carbs: 0,
        fats: 15,
      },
      {
        id: '6',
        title: 'Mercimek Çorbası',
        cuisine: 'Türk',
        diet_type: 'Vegan',
        time_minutes: 35,
        ingredients: ['Kırmızı mercimek', 'Soğan', 'Havuç', 'Baharatlar'],
        steps: [
          'Sebzeleri kavurun',
          'Mercimeği ekleyin',
          'Haşlayın',
          'Blenderdan geçirin'
        ],
        calories: 180,
        protein: 9,
        carbs: 30,
        fats: 2,
      },
    ];

    let filtered = mockRecipes;

    if (filter?.cuisine && filter.cuisine !== 'Tümü') {
      filtered = filtered.filter(r => r.cuisine === filter.cuisine);
    }

    if (filter?.diet_type && filter.diet_type !== 'Tümü') {
      filtered = filtered.filter(r => r.diet_type === filter.diet_type);
    }

    if (filter?.max_time) {
      filtered = filtered.filter(r => r.time_minutes <= filter.max_time!);
    }

    if (filter?.search) {
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(filter.search!.toLowerCase())
      );
    }

    if (filter?.ingredient) {
      filtered = filtered.filter(r =>
        r.ingredients.some(ing => 
          ing.toLowerCase().includes(filter.ingredient?.toLowerCase() || '')
        )
      );
    }

    return filtered;
  }
}
