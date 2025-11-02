import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { colors, shadows } from '../theme';
import { RecipeService } from '../services/recipeService';
import { Recipe, RecipeMode } from '../types/recipe';
import VoiceAssistantModal from '../components/VoiceAssistantModal';
import { useAppStore } from '../store/useAppStore';
import { AuthService } from '../services/authService';
import { PlanService } from '../services/planService';
import { usePlans } from '../hooks/usePlans';

interface RouteParams {
  initialIngredients?: string;
  mealDescription?: string; // Öğün açıklaması
  mealData?: {
    id?: string; // Mevcut öğün ID'si
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  selectedDay?: string;
  selectedMealType?: string;
  updateExistingMeal?: boolean; // Mevcut öğünü güncelleme flag'i
  // Plan state preservation
  planName?: string;
  goal?: string;
  dailyCalories?: number;
  dailyProtein?: number;
  dailyCarbs?: number;
  dailyFat?: number;
  weeklyPlan?: any;
  existingPlan?: any;
  // DietPlan interface uyumlu alanlar
  planId?: string;
  planType?: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'custom';
  targetWeight?: number;
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  duration?: number;
  // PlanEditScreen'den gelen plan state'i
  currentPlanState?: {
    planName: string;
    goal: string;
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyFat: number;
    weeklyPlan: any;
    existingPlan: any;
  };
}

interface Props {
  navigation?: any;
  route?: {
    params?: RouteParams;
  };
}

export default function IngredientsToRecipeScreen({ navigation, route }: Props = {}) {
  const { isDark } = useTheme();
  const params = route?.params;
  
  // Global store'dan plan yönetimi fonksiyonlarını al
  const { 
    currentPlan, 
    createNewPlan, 
    addRecipeToMeal, 
    updateMealById,
    setCurrentPlan 
  } = useAppStore();
  
  const [ingredients, setIngredients] = useState(
    params?.initialIngredients || params?.mealDescription || ''
  );
  const [selectedMode, setSelectedMode] = useState<RecipeMode>('normal');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // If we have meal data, automatically generate recipes
  useEffect(() => {
    if (params?.initialIngredients && params?.mealData) {
      // Auto-generate recipes when coming from meal plan
      setTimeout(() => {
        handleGenerateRecipes();
      }, 500);
    }
  }, [params]);

  const modes = RecipeService.getRecipeModes();

  const handleGenerateRecipes = async () => {
    if (!ingredients.trim()) {
      Alert.alert('Hata', 'Lütfen en az bir malzeme girin');
      return;
    }

    const ingredientList = ingredients
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    if (ingredientList.length === 0) {
      Alert.alert('Hata', 'Lütfen geçerli malzemeler girin (virgülle ayırın)');
      return;
    }

    setLoading(true);
    try {
      const generatedRecipes = await RecipeService.generateRecipes(ingredientList, selectedMode);
      setRecipes(generatedRecipes);
      
      if (generatedRecipes.length === 0) {
        Alert.alert('Bilgi', 'Tarif bulunamadı. Lütfen farklı malzemeler deneyin.');
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Tarifler oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleRecipePress = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShowRecipeModal(true);
  };

  const handleReset = () => {
    setIngredients('');
    setRecipes([]);
    setSelectedMode('normal');
  };

  const { plans, activePlan: activeUserPlan } = usePlans();

  const handleAddToPlan = async (recipe: Recipe) => {
    try {
      // Kullanıcıyı al
      const user = await AuthService.getCurrentUser();
      if (!user) {
        Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
        return;
      }

      // Önce currentPlan'ı kontrol et, sonra activePlan'ı
      const planToUse = currentPlan || activeUserPlan || plans.find(plan => plan.is_active);
      
      if (!planToUse) {
        Alert.alert('Hata', 'Aktif plan bulunamadı. Önce bir plan oluşturun.');
        return;
      }

      // Gün ve öğün türü seçimi için modal göster
      Alert.alert(
        'Plana Ekle',
        'Bu tarifi hangi güne ve öğüne eklemek istiyorsunuz?',
        [
          {
            text: 'İptal',
            style: 'cancel'
          },
          {
            text: 'Seç',
            onPress: () => showDayMealSelector(recipe, planToUse)
          }
        ]
      );
    } catch (error) {
      console.error('Plan ekleme hatası:', error);
      Alert.alert('Hata', 'Tarif plana eklenirken bir hata oluştu');
    }
  };

  const showDayMealSelector = (recipe: Recipe, activePlan: any) => {
    // Kullanıcının seçtiği günü kullan, yoksa bugünü kullan
    let selectedDay = params?.selectedDay;
    
    if (!selectedDay) {
      const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long' }).toLowerCase();
      const dayMap: { [key: string]: string } = {
        'pazartesi': 'pazartesi',
        'salı': 'sali', 
        'çarşamba': 'carsamba',
        'perşembe': 'persembe',
        'cuma': 'cuma',
        'cumartesi': 'cumartesi',
        'pazar': 'pazar'
      };
      selectedDay = dayMap[today] || 'pazartesi';
    }
    
    // Kullanıcının seçtiği öğün türünü kullan, yoksa seçim yap
    const selectedMealType = params?.selectedMealType;
    
    if (selectedMealType) {
      // Öğün türü zaten seçilmişse direkt ekle
      addRecipeToActivePlan(recipe, activePlan, selectedDay, selectedMealType);
    } else {
      // Öğün türü seçilmemişse kullanıcıya sor
      Alert.alert(
        'Öğün Seçin',
        'Bu tarifi hangi öğüne eklemek istiyorsunuz?',
        [
          {
            text: 'Kahvaltı',
            onPress: () => addRecipeToActivePlan(recipe, activePlan, selectedDay, 'breakfast')
          },
          {
            text: 'Öğle',
            onPress: () => addRecipeToActivePlan(recipe, activePlan, selectedDay, 'lunch')
          },
          {
            text: 'Akşam',
            onPress: () => addRecipeToActivePlan(recipe, activePlan, selectedDay, 'dinner')
          },
          {
            text: 'Atıştırmalık',
            onPress: () => addRecipeToActivePlan(recipe, activePlan, selectedDay, 'snacks')
          }
        ]
      );
    }
  };

  const addRecipeToActivePlan = async (recipe: Recipe, planToUse: any, selectedDay: string, selectedMealType: string) => {
    try {
      // Tarifin yapılış talimatlarını açıklama olarak kullan
      const recipeDescription = recipe.steps && recipe.steps.length > 0 
        ? recipe.steps.join(' • ') 
        : `${recipe.title} tarifi`;
      
      const mealPlan = {
        id: Math.random().toString(36).substr(2, 9),
        name: recipe.title,
        description: recipeDescription,
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
      } else {
        // Eğer plan henüz kaydedilmemişse, currentPlan'ı güncelle
        setCurrentPlan(updatedPlan);
      }
      
      // Tarif başarıyla eklendikten sonra otomatik olarak plan sayfasına yönlendir
      setShowRecipeModal(false); // Modal'ı kapat
      
      Alert.alert(
        'Başarılı', 
        'Tarif plana eklendi! Plan sayfasına yönlendiriliyorsunuz.',
        [
          {
            text: 'Tamam',
            onPress: () => {
              // Plan sayfasına geri dön
              if (navigation && navigation.goBack) {
                navigation.goBack();
              } else if (navigation && navigation.navigate) {
                navigation.navigate('plan');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Plan güncelleme hatası:', error);
      Alert.alert('Hata', 'Tarif plana eklenirken bir hata oluştu');
    }
  };

  const handleOldAddToPlan = (recipe: Recipe) => {
    if (!navigation) return;

    // Mevcut plan bilgilerini params'dan oluştur
    const currentPlanData = {
      name: params?.planName || 'Yeni Plan',
      goal: params?.goal || 'maintenance',
      daily_calories: params?.dailyCalories || 2000,
      daily_protein: params?.dailyProtein || 100,
      daily_carbs: params?.dailyCarbs || 250,
      daily_fat: params?.dailyFat || 70,
      weekly_plan: params?.weeklyPlan || {},
    };

    Alert.alert(
      'Plana Ekle',
      'Bu tarifi hangi plana eklemek istiyorsunuz?',
      [
        {
          text: 'Mevcut Plan',
          onPress: () => {
            // Mevcut plana ekle - plan bilgilerini geç
            navigation.navigate('editPlan', {
              plan: currentPlanData,
              selectedRecipe: {
                name: recipe.title,
                calories: recipe.calories,
                protein: recipe.protein,
                carbs: recipe.carbs,
                fat: recipe.fats,
                ingredients: recipe.ingredients,
                instructions: recipe.steps
              },
              selectedDay: params?.selectedDay,
              selectedMealType: params?.selectedMealType,
            });
          },
        },
        {
          text: 'Plan Seç',
          onPress: () => {
            // Plan seçme ekranına git
            navigation.navigate('editPlan', {
              selectedRecipe: {
                name: recipe.title,
                calories: recipe.calories,
                protein: recipe.protein,
                carbs: recipe.carbs,
                fat: recipe.fats,
                ingredients: recipe.ingredients,
                instructions: recipe.steps
              },
            });
          },
        },
        {
          text: 'İptal',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={isDark ? ['#1E3A8A', '#1E40AF', '#2563EB'] : ['#10B981', '#059669'] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerText}>
          <Text style={styles.title}>Tarif Oluşturucu</Text>
          <Text style={styles.subtitle}>Malzemelerden lezzetli tarifler</Text>
        </View>
        
        {/* Voice Assistant Button */}
        <TouchableOpacity
          style={styles.voiceButton}
          onPress={() => setShowVoiceModal(true)}
        >
          <MaterialIcons name="mic" size={28} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Malzemeler *</Text>
          <Text style={styles.hint}>Virgülle ayırarak yazın (örn: yumurta, domates, yoğurt)</Text>
          <TextInput
            style={styles.input}
            value={ingredients}
            onChangeText={setIngredients}
            placeholder="yumurta, domates, peynir"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Mode Selection */}
        <View style={styles.modeSection}>
          <Text style={styles.label}>Tarif Modu</Text>
          <View style={styles.modeGrid}>
            {modes.map((mode) => (
              <TouchableOpacity
                key={mode.value}
                style={[
                  styles.modeButton,
                  selectedMode === mode.value && styles.modeButtonActive
                ]}
                onPress={() => setSelectedMode(mode.value)}
              >
                <Text style={styles.modeIcon}>{mode.icon}</Text>
                <Text
                  style={[
                    styles.modeLabel,
                    selectedMode === mode.value && styles.modeLabelActive
                  ]}
                >
                  {mode.label}
                </Text>
                <Text style={styles.modeDescription}>{mode.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.generateButton]}
            onPress={handleGenerateRecipes}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <MaterialIcons name="restaurant" size={20} color="white" />
                <Text style={styles.buttonText}>Tarifleri Getir</Text>
              </>
            )}
          </TouchableOpacity>

          {recipes.length > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={handleReset}
            >
              <MaterialIcons name="refresh" size={20} color="#666" />
              <Text style={styles.resetButtonText}>Sıfırla</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recipes List */}
        {recipes.length > 0 && (
          <View style={styles.recipesSection}>
            <Text style={styles.sectionTitle}>
              {recipes.length} Tarif Bulundu
            </Text>
            {recipes.map((recipe, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recipeCard}
                onPress={() => handleRecipePress(recipe)}
              >
                <View style={styles.recipeHeader}>
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  <MaterialIcons name="chevron-right" size={24} color="#999" />
                </View>

                <View style={styles.recipeInfo}>
                  <View style={styles.infoItem}>
                    <MaterialIcons name="schedule" size={16} color="#666" />
                    <Text style={styles.infoText}>{recipe.time}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <MaterialIcons name="local-fire-department" size={16} color="#FF5722" />
                    <Text style={styles.infoText}>{recipe.calories} kcal</Text>
                  </View>
                </View>

                <View style={styles.macroRow}>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{recipe.protein}g</Text>
                    <Text style={styles.macroLabel}>Protein</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{recipe.carbs}g</Text>
                    <Text style={styles.macroLabel}>Karbonhidrat</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{recipe.fats}g</Text>
                    <Text style={styles.macroLabel}>Yağ</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!loading && recipes.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="restaurant-menu" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Henüz tarif oluşturulmadı</Text>
            <Text style={styles.emptySubtext}>
              Malzemelerinizi girin ve "Tarifleri Getir" butonuna tıklayın
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onRecipesGenerated={(generatedRecipes) => {
          setRecipes(generatedRecipes);
          setShowVoiceModal(false);
        }}
      />

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <Modal
          visible={showRecipeModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowRecipeModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedRecipe.title}</Text>
                <TouchableOpacity
                  onPress={() => setShowRecipeModal(false)}
                  style={styles.closeButton}
                >
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Recipe Info */}
                <View style={styles.modalInfoRow}>
                  <View style={styles.modalInfoItem}>
                    <MaterialIcons name="schedule" size={20} color="#666" />
                    <Text style={styles.modalInfoText}>{selectedRecipe.time}</Text>
                  </View>
                  <View style={styles.modalInfoItem}>
                    <MaterialIcons name="local-fire-department" size={20} color="#FF5722" />
                    <Text style={styles.modalInfoText}>{selectedRecipe.calories} kcal</Text>
                  </View>
                </View>

                {/* Macros */}
                <View style={styles.modalMacros}>
                  <View style={styles.modalMacroItem}>
                    <Text style={styles.modalMacroValue}>{selectedRecipe.protein}g</Text>
                    <Text style={styles.modalMacroLabel}>Protein</Text>
                  </View>
                  <View style={styles.modalMacroItem}>
                    <Text style={styles.modalMacroValue}>{selectedRecipe.carbs}g</Text>
                    <Text style={styles.modalMacroLabel}>Karbonhidrat</Text>
                  </View>
                  <View style={styles.modalMacroItem}>
                    <Text style={styles.modalMacroValue}>{selectedRecipe.fats}g</Text>
                    <Text style={styles.modalMacroLabel}>Yağ</Text>
                  </View>
                </View>

                {/* Ingredients */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Malzemeler</Text>
                  {selectedRecipe.ingredients.map((ingredient, index) => (
                    <View key={index} style={styles.ingredientItem}>
                      <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                      <Text style={styles.ingredientText}>{ingredient}</Text>
                    </View>
                  ))}
                </View>

                {/* Steps */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Hazırlanışı</Text>
                  {selectedRecipe.steps.map((step, index) => (
                    <View key={index} style={styles.stepItem}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </View>

                {/* Add to Plan Button */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                  style={styles.addToPlanButton}
                  onPress={() => handleAddToPlan(selectedRecipe)}
                >
                    <LinearGradient
                      colors={['#4CAF50', '#45a049']}
                      style={styles.addToPlanButtonGradient}
                    >
                      <MaterialIcons name="add-circle" size={20} color="white" />
                      <Text style={styles.addToPlanButtonText}>Plana Ekle</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  containerDark: {
    backgroundColor: colors.dark.background,
  },
  header: {
    padding: 24,
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  voiceButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  inputSection: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modeSection: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 15,
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  modeButton: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  modeButtonActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
  },
  modeIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 3,
  },
  modeLabelActive: {
    color: '#4CAF50',
  },
  modeDescription: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  actionButtons: {
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 8,
  },
  generateButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recipesSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  recipeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  recipeInfo: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  macroLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  modalScroll: {
    padding: 20,
  },
  modalInfoRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  modalInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  modalInfoText: {
    fontSize: 14,
    color: '#666',
  },
  modalMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  modalMacroItem: {
    alignItems: 'center',
  },
  modalMacroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  modalMacroLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
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
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  ingredientText: {
    fontSize: 14,
    color: '#333',
  },
  stepItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  modalActions: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 20,
  },
  addToPlanButton: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  addToPlanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  addToPlanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
