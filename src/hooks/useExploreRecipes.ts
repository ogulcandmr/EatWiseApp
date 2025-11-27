import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { RecipeDbService, RecipeDb } from '../services/recipeDbService';
import { AuthService } from '../services/authService';
import { PlanService } from '../services/planService';
import { usePlans } from './usePlans';
import { useAppStore } from '../store/useAppStore';

export const useExploreRecipes = (navigation: any) => {
  const [recipes, setRecipes] = useState<RecipeDb[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<RecipeDb[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  const [selectedDietType, setSelectedDietType] = useState<string>('');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<number | null>(null);

  const { plans } = usePlans();
  const { currentPlan, activePlan } = useAppStore();

  const cuisines = RecipeDbService.getCuisineTypes();
  const dietTypes = RecipeDbService.getDietTypes();
  const timeFilters = RecipeDbService.getTimeFilters();

  useEffect(() => {
    loadRecipes();
    loadFavorites();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [recipes, searchText, selectedCuisine, selectedDietType, selectedTimeFilter]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const data = await RecipeDbService.getRecipes();
      setRecipes(data);
    } catch (error) {
      console.error('Error loading recipes:', error);
      Alert.alert('Hata', 'Tarifler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const user = await AuthService.getCurrentUser();
      if (user) {
        const favoriteRecipes = await RecipeDbService.getUserFavorites(user.id);
        setFavorites(favoriteRecipes.map(recipe => recipe.id));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const applyFilters = () => {
    let filtered = recipes;
    if (searchText) {
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(searchText.toLowerCase()) ||
        recipe.ingredients.some(ingredient =>
          ingredient.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
    if (selectedCuisine) filtered = filtered.filter(recipe => recipe.cuisine === selectedCuisine);
    if (selectedDietType) filtered = filtered.filter(recipe => recipe.diet_type === selectedDietType);
    if (selectedTimeFilter !== null) filtered = filtered.filter(recipe => recipe.time_minutes <= selectedTimeFilter);
    setFilteredRecipes(filtered);
  };

  const toggleFavorite = async (recipeId: string) => {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) return;
      const isFav = favorites.includes(recipeId);
      if (isFav) {
        await RecipeDbService.removeFromFavorites(user.id, recipeId);
        setFavorites(prev => prev.filter(id => id !== recipeId));
      } else {
        await RecipeDbService.addToFavorites(user.id, recipeId);
        setFavorites(prev => [...prev, recipeId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Hata', 'Favori işlemi sırasında bir hata oluştu');
    }
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedCuisine('');
    setSelectedDietType('');
    setSelectedTimeFilter(null);
  };

  const handleAddRecipeToPlan = async (recipe: RecipeDb, day: string, mealType: string) => {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) return;

      const planToUse = currentPlan || activePlan || plans.find(plan => plan.is_active);
      if (!planToUse) {
        Alert.alert('Hata', 'Aktif plan bulunamadı');
        return;
      }

      const mealPlan = {
        id: recipe.id,
        name: recipe.title,
        description: `${recipe.cuisine} mutfağından`,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fats,
        ingredients: recipe.ingredients,
        instructions: recipe.steps
      };

      const updatedPlan = { ...planToUse };
      if (!updatedPlan.weekly_plan) {
         updatedPlan.weekly_plan = {
           pazartesi: { breakfast: [], lunch: [], dinner: [], snacks: [] },
           sali: { breakfast: [], lunch: [], dinner: [], snacks: [] },
           carsamba: { breakfast: [], lunch: [], dinner: [], snacks: [] },
           persembe: { breakfast: [], lunch: [], dinner: [], snacks: [] },
           cuma: { breakfast: [], lunch: [], dinner: [], snacks: [] },
           cumartesi: { breakfast: [], lunch: [], dinner: [], snacks: [] },
           pazar: { breakfast: [], lunch: [], dinner: [], snacks: [] },
         };
       }
       
       if (!updatedPlan.weekly_plan[day]) {
         updatedPlan.weekly_plan[day] = {
           breakfast: [],
           lunch: [],
           dinner: [],
           snacks: []
         };
       }

       const dayPlan = updatedPlan.weekly_plan[day];
       if (mealType === 'snacks') {
         dayPlan.snacks = dayPlan.snacks || [];
         dayPlan.snacks.push(mealPlan);
       } else {
         (dayPlan as any)[mealType].push(mealPlan);
       }

       if (planToUse.id) {
         await PlanService.updatePlan(planToUse.id, updatedPlan);
       }

      Alert.alert('Başarılı', 'Tarif plana eklendi', [
        { text: 'Tamam', onPress: () => navigation?.navigate('plan') }
      ]);
    } catch (error) {
      console.error('Error adding recipe to plan:', error);
      Alert.alert('Hata', 'Tarif plana eklenirken bir hata oluştu');
    }
  };

  return {
    filteredRecipes,
    loading,
    searchText,
    setSearchText,
    favorites,
    toggleFavorite,
    // Filters
    cuisines,
    dietTypes,
    timeFilters,
    selectedCuisine,
    setSelectedCuisine,
    selectedDietType,
    setSelectedDietType,
    selectedTimeFilter,
    setSelectedTimeFilter,
    clearFilters,
    // Actions
    handleAddRecipeToPlan
  };
};