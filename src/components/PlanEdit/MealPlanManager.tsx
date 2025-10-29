import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DietPlan, MealPlan, DayPlan } from '../../services/planService';

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Kahvaltı', icon: 'sunny', color: '#F39C12' },
  { value: 'lunch', label: 'Öğle Yemeği', icon: 'restaurant', color: '#E74C3C' },
  { value: 'dinner', label: 'Akşam Yemeği', icon: 'moon', color: '#8E44AD' },
] as const;

interface MealPlanManagerProps {
  isDark: boolean;
  selectedDay: keyof DietPlan['weekly_plan'];
  setSelectedDay: (day: keyof DietPlan['weekly_plan']) => void;
  selectedMealType: keyof DayPlan;
  setSelectedMealType: (mealType: keyof DayPlan) => void;
  weeklyPlan: DietPlan['weekly_plan'];
  currentMeals: MealPlan[];
  addMeal: () => void;
  updateMeal: (mealIndex: number, field: keyof MealPlan, value: string | number) => void;
  deleteMeal: (mealIndex: number) => void;
  onNavigateToRecipe?: (params: any) => void;
  autoSavePlan?: () => Promise<void>;
  styles: any;
}

const dayLabels: Record<keyof DietPlan['weekly_plan'], string> = {
  pazartesi: 'Pazartesi',
  sali: 'Salı',
  carsamba: 'Çarşamba',
  persembe: 'Perşembe',
  cuma: 'Cuma',
  cumartesi: 'Cumartesi',
  pazar: 'Pazar',
};

export default function MealPlanManager({
  isDark,
  selectedDay,
  setSelectedDay,
  selectedMealType,
  setSelectedMealType,
  weeklyPlan,
  currentMeals,
  addMeal,
  updateMeal,
  deleteMeal,
  onNavigateToRecipe,
  autoSavePlan,
  styles,
}: MealPlanManagerProps) {
  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long' }).toLowerCase();
  const dayMapping: Record<string, keyof DietPlan['weekly_plan']> = {
    'pazartesi': 'pazartesi',
    'salı': 'sali',
    'çarşamba': 'carsamba',
    'perşembe': 'persembe',
    'cuma': 'cuma',
    'cumartesi': 'cumartesi',
    'pazar': 'pazar'
  };
  const todayKey = dayMapping[today];

  const handleAddRecipe = async () => {
    // Plan kaydetme işlemini otomatik yap
    if (autoSavePlan) {
      await autoSavePlan();
    }
    
    onNavigateToRecipe?.({
      selectedDay,
      selectedMealType,
      planName: 'current_plan',
      goal: 'weight_loss',
      dailyCalories: 2000,
      dailyProtein: 100,
      dailyCarbs: 250,
      dailyFat: 70,
      weeklyPlan,
    });
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
        Haftalık Plan
      </Text>

      {/* Day Selector */}
      <View style={styles.daySelectorContainer}>
        <Text style={[styles.daySelectorTitle, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
          Gün Seçin
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
          {Object.keys(dayLabels).map((day) => {
            const dayKey = day as keyof DietPlan['weekly_plan'];
            const isToday = dayKey === todayKey;
            const isSelected = selectedDay === dayKey;
            
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayChip,
                  isSelected && styles.dayChipActive,
                  isToday && !isSelected && styles.dayChipToday,
                ]}
                onPress={() => setSelectedDay(dayKey)}
              >
                <Text style={[
                  styles.dayChipText,
                  { color: isDark ? '#FFFFFF' : '#2C3E50' },
                  isSelected && styles.dayChipTextActive,
                  isToday && !isSelected && styles.dayChipTextToday,
                ]}>
                  {dayLabels[dayKey]}
                </Text>
                {isToday && !isSelected && (
                  <View style={styles.todayIndicator}>
                    <Text style={styles.todayIndicatorText}>BUGÜN</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Meal Type Selector */}
      <View style={styles.mealTypeSelectorContainer}>
        <Text style={[styles.mealTypeSelectorTitle, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
          Öğün Tipi
        </Text>
        <View style={styles.mealTypeSelector}>
          {MEAL_TYPES.map((mealType) => (
            <TouchableOpacity
              key={mealType.value}
              style={[
                styles.mealTypeChip,
                selectedMealType === mealType.value && styles.mealTypeChipActive,
              ]}
              onPress={() => setSelectedMealType(mealType.value as keyof DayPlan)}
            >
              <Ionicons 
                name={mealType.icon as any} 
                size={14} 
                color={selectedMealType === mealType.value ? mealType.color : (isDark ? '#888888' : '#999999')} 
              />
              <Text style={[
                styles.mealTypeChipText,
                { color: isDark ? '#FFFFFF' : '#2C3E50' },
                selectedMealType === mealType.value && styles.mealTypeChipTextActive,
                selectedMealType === mealType.value && { color: mealType.color }
              ]}>
                {mealType.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Meals Section */}
      <LinearGradient
        colors={isDark ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']}
        style={styles.card}
      >
        <View style={styles.mealsHeader}>
          <View style={styles.mealsHeaderInfo}>
            <Text style={[styles.mealsTitle, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
              {dayLabels[selectedDay]} - {MEAL_TYPES.find(m => m.value === selectedMealType)?.label}
            </Text>
            <Text style={[styles.mealsSubtitle, { color: isDark ? '#B0B0B0' : '#7F8C8D' }]}>
              {currentMeals.length} öğün
            </Text>
          </View>
          <View style={styles.mealsHeaderActions}>
            <TouchableOpacity style={styles.addRecipeButton} onPress={handleAddRecipe}>
              <Ionicons name="restaurant" size={12} color="#667EEA" />
              <Text style={styles.addRecipeButtonText}>Tarif Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {currentMeals.length === 0 ? (
          <View style={styles.emptyMeals}>
            <Ionicons name="restaurant-outline" size={48} color={isDark ? '#666666' : '#CCCCCC'} />
            <Text style={[styles.emptyMealsText, { color: isDark ? '#888888' : '#999999' }]}>
              Henüz öğün eklenmemiş
            </Text>
          </View>
        ) : (
          currentMeals.map((meal, index) => (
            <View key={index} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <TextInput
                  style={[styles.mealNameInput, { 
                    color: isDark ? '#FFFFFF' : '#2C3E50',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                  }]}
                  placeholder="Öğün adı"
                  placeholderTextColor={isDark ? '#888888' : '#999999'}
                  value={meal.name}
                  onChangeText={(text) => updateMeal(index, 'name', text)}
                />
                <TouchableOpacity
                  style={styles.deleteMealButton}
                  onPress={() => deleteMeal(index)}
                >
                  <Ionicons name="trash-outline" size={16} color="#E74C3C" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.mealDescriptionInput, { 
                  color: isDark ? '#FFFFFF' : '#2C3E50',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                }]}
                placeholder="Açıklama (opsiyonel)"
                placeholderTextColor={isDark ? '#888888' : '#999999'}
                value={meal.description}
                onChangeText={(text) => updateMeal(index, 'description', text)}
                multiline
              />

              {/* Tarif Oluştur Butonu - sadece açıklama yazıldığında görünür */}
              {meal.description && meal.description.trim().length > 0 && (
                <TouchableOpacity
                  style={styles.createRecipeButton}
                  onPress={async () => {
                    // Plan kaydetme işlemini otomatik yap
                    if (autoSavePlan) {
                      await autoSavePlan();
                    }
                    
                    onNavigateToRecipe?.({
                      selectedDay,
                      selectedMealType,
                      planName: 'current_plan',
                      goal: 'weight_loss',
                      dailyCalories: 2000,
                      dailyProtein: 100,
                      dailyCarbs: 250,
                      dailyFat: 70,
                      weeklyPlan,
                      mealDescription: meal.description, // Açıklamayı malzemeler kısmına göndermek için
                      mealIndex: index // Hangi öğün için tarif oluşturulduğunu bilmek için
                    });
                  }}
                >
                  <Ionicons name="restaurant" size={16} color="#667EEA" />
                  <Text style={styles.createRecipeButtonText}>Tarif Oluştur</Text>
                </TouchableOpacity>
              )}

              <View style={styles.mealNutritionGrid}>
                <View style={styles.mealNutritionItem}>
                  <Text style={[styles.mealNutritionLabel, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                    Kalori
                  </Text>
                  <TextInput
                    style={[styles.mealNutritionInput, { 
                      color: isDark ? '#FFFFFF' : '#2C3E50',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                    }]}
                    placeholder="0"
                    placeholderTextColor={isDark ? '#888888' : '#999999'}
                    value={meal.calories.toString()}
                    onChangeText={(text) => updateMeal(index, 'calories', Number(text) || 0)}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.mealNutritionItem}>
                  <Text style={[styles.mealNutritionLabel, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                    Protein
                  </Text>
                  <TextInput
                    style={[styles.mealNutritionInput, { 
                      color: isDark ? '#FFFFFF' : '#2C3E50',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                    }]}
                    placeholder="0"
                    placeholderTextColor={isDark ? '#888888' : '#999999'}
                    value={meal.protein.toString()}
                    onChangeText={(text) => updateMeal(index, 'protein', Number(text) || 0)}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.mealNutritionItem}>
                  <Text style={[styles.mealNutritionLabel, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                    Karb.
                  </Text>
                  <TextInput
                    style={[styles.mealNutritionInput, { 
                      color: isDark ? '#FFFFFF' : '#2C3E50',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                    }]}
                    placeholder="0"
                    placeholderTextColor={isDark ? '#888888' : '#999999'}
                    value={meal.carbs.toString()}
                    onChangeText={(text) => updateMeal(index, 'carbs', Number(text) || 0)}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.mealNutritionItem}>
                  <Text style={[styles.mealNutritionLabel, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                    Yağ
                  </Text>
                  <TextInput
                    style={[styles.mealNutritionInput, { 
                      color: isDark ? '#FFFFFF' : '#2C3E50',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                    }]}
                    placeholder="0"
                    placeholderTextColor={isDark ? '#888888' : '#999999'}
                    value={meal.fat.toString()}
                    onChangeText={(text) => updateMeal(index, 'fat', Number(text) || 0)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          ))
        )}
      </LinearGradient>
    </View>
  );
}