import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Modal,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { RecipeDbService, RecipeDb } from '../services/recipeDbService';
import { AuthService } from '../services/authService';
import { usePlans } from '../hooks/usePlans';
import { PlanService } from '../services/planService';
import { useAppStore } from '../store/useAppStore';

const { width } = Dimensions.get('window');

interface ExploreScreenProps {
  navigation?: {
    navigate: (screen: any, params?: any) => void;
    goBack: () => void;
  };
  user?: any;
}

export default function ExploreScreen({ navigation }: ExploreScreenProps) {
  const [recipes, setRecipes] = useState<RecipeDb[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<RecipeDb[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  const [selectedDietType, setSelectedDietType] = useState<string>('');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDb | null>(null);
  const [recipeDetailVisible, setRecipeDetailVisible] = useState(false);
  const [addToPlanVisible, setAddToPlanVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedMealType, setSelectedMealType] = useState<string>('');

  const { plans } = usePlans();
  const { currentPlan, activePlan } = useAppStore();

  // Filter options
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

    if (selectedCuisine) {
      filtered = filtered.filter(recipe => recipe.cuisine === selectedCuisine);
    }

    if (selectedDietType) {
      filtered = filtered.filter(recipe => recipe.diet_type === selectedDietType);
    }

    if (selectedTimeFilter !== null) {
      filtered = filtered.filter(recipe => recipe.time_minutes <= selectedTimeFilter);
    }

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
    setShowFilters(false);
  };

  const addRecipeToPlan = async () => {
    if (!selectedRecipe || !selectedDay || !selectedMealType) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    try {
      const user = await AuthService.getCurrentUser();
      if (!user) return;

      // Önce currentPlan'ı kontrol et, sonra activePlan'ı
      const planToUse = currentPlan || activePlan || plans.find(plan => plan.is_active);
      if (!planToUse) {
        Alert.alert('Hata', 'Aktif plan bulunamadı');
        return;
      }

      const mealPlan = {
        id: selectedRecipe.id,
        name: selectedRecipe.title,
        description: `${selectedRecipe.cuisine} mutfağından`,
        calories: selectedRecipe.calories,
        protein: selectedRecipe.protein,
        carbs: selectedRecipe.carbs,
        fat: selectedRecipe.fats,
        ingredients: selectedRecipe.ingredients,
        instructions: selectedRecipe.steps
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
       
       if (!updatedPlan.weekly_plan[selectedDay]) {
         updatedPlan.weekly_plan[selectedDay] = {
           breakfast: [],
           lunch: [],
           dinner: [],
           snacks: []
         };
       }

       const dayPlan = updatedPlan.weekly_plan[selectedDay];
       if (selectedMealType === 'snacks') {
         dayPlan.snacks = dayPlan.snacks || [];
         dayPlan.snacks.push(mealPlan);
       } else {
         (dayPlan as any)[selectedMealType].push(mealPlan);
       }

       if (planToUse.id) {
         await PlanService.updatePlan(planToUse.id, updatedPlan);
       }
      
      setAddToPlanVisible(false);
      setSelectedDay('');
      setSelectedMealType('');
      Alert.alert('Başarılı', 'Tarif plana eklendi', [
        {
          text: 'Tamam',
          onPress: () => {
            if (navigation?.navigate) {
              navigation.navigate('plan');
            }
          }
        }
      ]);
    } catch (error) {
      console.error('Error adding recipe to plan:', error);
      Alert.alert('Hata', 'Tarif plana eklenirken bir hata oluştu');
    }
  };

  const renderRecipeCard = ({ item }: { item: RecipeDb }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => {
        setSelectedRecipe(item);
        setRecipeDetailVisible(true);
      }}
    >
      <View style={styles.cardContent}>
        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.recipeImage} />
        )}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item.id)}
        >
          <Ionicons
            name={favorites.includes(item.id) ? 'heart' : 'heart-outline'}
            size={24}
            color={favorites.includes(item.id) ? '#FF6B6B' : '#666'}
          />
        </TouchableOpacity>
        <View style={styles.cardInfo}>
          <Text style={styles.recipeTitle}>{item.title}</Text>
          <View style={styles.recipeTags}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.cuisine}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.time_minutes} dk</Text>
            </View>
          </View>
          <View style={styles.nutritionInfo}>
            <Text style={styles.nutritionText}>{item.calories} kcal</Text>
            <Text style={styles.nutritionText}>P: {item.protein}g</Text>
            <Text style={styles.nutritionText}>C: {item.carbs}g</Text>
            <Text style={styles.nutritionText}>F: {item.fats}g</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Tarifler</Text>
        <Text style={styles.headerSubtitle}>Sağlıklı tarifler keşfedin</Text>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tarif veya malzeme ara..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options" size={20} color="#10B981" />
        </TouchableOpacity>
      </View>

      {/* Filter Options */}
      {showFilters && (
        <View style={styles.filterOptions}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {/* Cuisine Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Mutfak</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {cuisines.map((cuisine) => (
                    <TouchableOpacity
                      key={cuisine}
                      style={[
                        styles.filterChip,
                        selectedCuisine === cuisine && styles.filterChipActive
                      ]}
                      onPress={() => setSelectedCuisine(selectedCuisine === cuisine ? '' : cuisine)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        selectedCuisine === cuisine && styles.filterChipTextActive
                      ]}>
                        {cuisine}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Diet Type Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Diyet</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {dietTypes.map((dietType) => (
                    <TouchableOpacity
                      key={dietType}
                      style={[
                        styles.filterChip,
                        selectedDietType === dietType && styles.filterChipActive
                      ]}
                      onPress={() => setSelectedDietType(selectedDietType === dietType ? '' : dietType)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        selectedDietType === dietType && styles.filterChipTextActive
                      ]}>
                        {dietType}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Time Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Süre</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {timeFilters.map((timeFilter) => (
                    <TouchableOpacity
                      key={timeFilter.label}
                      style={[
                        styles.filterChip,
                        selectedTimeFilter === timeFilter.value && styles.filterChipActive
                      ]}
                      onPress={() => setSelectedTimeFilter(
                        selectedTimeFilter === timeFilter.value ? null : timeFilter.value
                      )}
                    >
                      <Text style={[
                        styles.filterChipText,
                        selectedTimeFilter === timeFilter.value && styles.filterChipTextActive
                      ]}>
                        {timeFilter.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </ScrollView>

          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Temizle</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Recipe Grid */}
      <FlatList
        data={filteredRecipes}
        renderItem={renderRecipeCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.recipeGrid}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>
              {loading ? 'Tarifler yükleniyor...' : 'Tarif bulunamadı'}
            </Text>
          </View>
        }
      />

      {/* Recipe Detail Modal */}
      <Modal
        visible={recipeDetailVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setRecipeDetailVisible(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Tarif Detayı</Text>
            <TouchableOpacity
              style={styles.addToPlanModalButton}
              onPress={() => {
                setRecipeDetailVisible(false);
                setAddToPlanVisible(true);
              }}
            >
              <Ionicons name="add" size={24} color="#10B981" />
            </TouchableOpacity>
          </View>

          {selectedRecipe && (
            <ScrollView style={styles.modalContent}>
              {selectedRecipe.image_url && (
                <Image
                  source={{ uri: selectedRecipe.image_url }}
                  style={styles.modalRecipeImage}
                />
              )}
              
              <View style={styles.modalRecipeInfo}>
                <Text style={styles.modalRecipeTitle}>{selectedRecipe.title}</Text>
                
                <View style={styles.modalRecipeTags}>
                  <View style={styles.modalTag}>
                    <Text style={styles.modalTagText}>{selectedRecipe.cuisine}</Text>
                  </View>
                  <View style={styles.modalTag}>
                    <Text style={styles.modalTagText}>{selectedRecipe.time_minutes} dk</Text>
                  </View>
                  <View style={styles.modalTag}>
                    <Text style={styles.modalTagText}>{selectedRecipe.diet_type}</Text>
                  </View>
                </View>

                <View style={styles.modalNutritionInfo}>
                  <View style={styles.modalNutritionItem}>
                    <Text style={styles.modalNutritionValue}>{selectedRecipe.calories}</Text>
                    <Text style={styles.modalNutritionLabel}>kcal</Text>
                  </View>
                  <View style={styles.modalNutritionItem}>
                    <Text style={styles.modalNutritionValue}>{selectedRecipe.protein}g</Text>
                    <Text style={styles.modalNutritionLabel}>Protein</Text>
                  </View>
                  <View style={styles.modalNutritionItem}>
                    <Text style={styles.modalNutritionValue}>{selectedRecipe.carbs}g</Text>
                    <Text style={styles.modalNutritionLabel}>Karbonhidrat</Text>
                  </View>
                  <View style={styles.modalNutritionItem}>
                    <Text style={styles.modalNutritionValue}>{selectedRecipe.fats}g</Text>
                    <Text style={styles.modalNutritionLabel}>Yağ</Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Malzemeler</Text>
                  {selectedRecipe.ingredients.map((ingredient, index) => (
                    <Text key={index} style={styles.modalIngredient}>
                      • {ingredient}
                    </Text>
                  ))}
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Hazırlanış</Text>
                  {selectedRecipe.steps.map((step, index) => (
                    <Text key={index} style={styles.modalStep}>
                      {index + 1}. {step}
                    </Text>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.favoriteModalButton}
                  onPress={() => toggleFavorite(selectedRecipe.id)}
                >
                  <Ionicons
                    name={favorites.includes(selectedRecipe.id) ? 'heart' : 'heart-outline'}
                    size={24}
                    color={favorites.includes(selectedRecipe.id) ? '#FF6B6B' : '#666'}
                  />
                  <Text style={styles.favoriteModalButtonText}>
                    {favorites.includes(selectedRecipe.id) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Add to Plan Modal */}
      <Modal
        visible={addToPlanVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.addToPlanModalContainer}>
          <BlurView intensity={20} style={styles.addToPlanModalBlur}>
            <View style={styles.addToPlanModalContent}>
              <View style={styles.addToPlanModalHeader}>
                <Text style={styles.addToPlanModalTitle}>Plana Ekle</Text>
                <TouchableOpacity
                  style={styles.addToPlanModalCloseButton}
                  onPress={() => setAddToPlanVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.addToPlanForm}>
                <View style={styles.addToPlanFormGroup}>
                  <Text style={styles.addToPlanFormLabel}>Gün</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.addToPlanDayButton,
                          selectedDay === day && styles.addToPlanDayButtonActive
                        ]}
                        onPress={() => setSelectedDay(day)}
                      >
                        <Text style={[
                          styles.addToPlanDayButtonText,
                          selectedDay === day && styles.addToPlanDayButtonTextActive
                        ]}>
                          {day === 'monday' ? 'Pzt' :
                           day === 'tuesday' ? 'Sal' :
                           day === 'wednesday' ? 'Çar' :
                           day === 'thursday' ? 'Per' :
                           day === 'friday' ? 'Cum' :
                           day === 'saturday' ? 'Cmt' : 'Paz'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.addToPlanFormGroup}>
                  <Text style={styles.addToPlanFormLabel}>Öğün</Text>
                  <View style={styles.addToPlanMealButtons}>
                    {[
                      { key: 'breakfast', label: 'Kahvaltı' },
                      { key: 'lunch', label: 'Öğle' },
                      { key: 'dinner', label: 'Akşam' },
                      { key: 'snacks', label: 'Atıştırmalık' }
                    ].map((meal) => (
                      <TouchableOpacity
                        key={meal.key}
                        style={[
                          styles.addToPlanMealButton,
                          selectedMealType === meal.key && styles.addToPlanMealButtonActive
                        ]}
                        onPress={() => setSelectedMealType(meal.key)}
                      >
                        <Text style={[
                          styles.addToPlanMealButtonText,
                          selectedMealType === meal.key && styles.addToPlanMealButtonTextActive
                        ]}>
                          {meal.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.addToPlanSubmitButton}
                  onPress={addRecipeToPlan}
                >
                  <Text style={styles.addToPlanSubmitButtonText}>Plana Ekle</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterOptions: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterRow: {
    gap: 15,
  },
  filterGroup: {
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: 'white',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  clearButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#666',
  },
  recipeGrid: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recipeCard: {
    flex: 1,
    margin: 5,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  recipeImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f5f5f5',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 8,
  },
  cardInfo: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  recipeTags: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#0369a1',
  },
  nutritionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 60,
  },
  modalCloseButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addToPlanModalButton: {
    padding: 5,
  },
  modalContent: {
    flex: 1,
  },
  modalRecipeImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f5f5f5',
  },
  modalRecipeInfo: {
    padding: 20,
  },
  modalRecipeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  modalRecipeTags: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  modalTag: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalTagText: {
    fontSize: 14,
    color: '#0369a1',
  },
  modalNutritionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
  },
  modalNutritionItem: {
    alignItems: 'center',
  },
  modalNutritionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  modalNutritionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalSection: {
    marginBottom: 25,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  modalIngredient: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    lineHeight: 24,
  },
  modalStep: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    lineHeight: 24,
  },
  favoriteModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    gap: 10,
  },
  favoriteModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  addToPlanModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  addToPlanModalBlur: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  addToPlanModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  addToPlanModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  addToPlanModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addToPlanModalCloseButton: {
    padding: 5,
  },
  addToPlanForm: {
    padding: 20,
  },
  addToPlanFormGroup: {
    marginBottom: 25,
  },
  addToPlanFormLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  addToPlanDayButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  addToPlanDayButtonActive: {
    backgroundColor: '#10B981',
  },
  addToPlanDayButtonText: {
    fontSize: 14,
    color: '#666',
  },
  addToPlanDayButtonTextActive: {
    color: 'white',
  },
  addToPlanMealButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  addToPlanMealButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  addToPlanMealButtonActive: {
    backgroundColor: '#10B981',
  },
  addToPlanMealButtonText: {
    fontSize: 14,
    color: '#666',
  },
  addToPlanMealButtonTextActive: {
    color: 'white',
  },
  addToPlanSubmitButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  addToPlanSubmitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
