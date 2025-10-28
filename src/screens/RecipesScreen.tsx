import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme';

interface GeneratedRecipe {
  id: number;
  title: string;
  calories: number;
  prepTime: number;
  ingredients: string[];
  instructions: string[];
}

export default function RecipesScreen() {
  const [ingredients, setIngredients] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipes, setGeneratedRecipes] = useState<GeneratedRecipe[]>([]);

  const generateRecipes = async () => {
    if (!ingredients.trim()) return;
    
    setIsGenerating(true);
    
    // Simüle edilmiş AI tarif üretimi
    setTimeout(() => {
      const mockRecipes: GeneratedRecipe[] = [
        {
          id: 1,
          title: 'Yumurta ve Yoğurtlu Kahvaltı',
          calories: 320,
          prepTime: 10,
          ingredients: ingredients.split(',').map((i: string) => i.trim()),
          instructions: [
            'Yumurtaları haşla',
            'Yoğurdu bir kaseye koy',
            'Haşlanmış yumurtayı yoğurdun üzerine ekle',
            'Tuz ve baharat ekle'
          ]
        },
        {
          id: 2,
          title: 'Sağlıklı Smoothie',
          calories: 180,
          prepTime: 5,
          ingredients: ingredients.split(',').map((i: string) => i.trim()),
          instructions: [
            'Tüm malzemeleri blender\'a koy',
            '2 dakika karıştır',
            'Buz ekle ve tekrar karıştır'
          ]
        }
      ];
      
      setGeneratedRecipes(mockRecipes);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <LinearGradient
          colors={gradients.secondary as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.title}>Malzemelerle Tarif Oluştur</Text>
          <Text style={styles.subtitle}>Elimdeki malzemelerle ne yapabilirim?</Text>
        </LinearGradient>

        {/* Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Malzemelerini yaz:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Örn: yumurta, yoğurt, domates, ekmek"
            value={ingredients}
            onChangeText={setIngredients}
            multiline
          />
          <TouchableOpacity 
            style={[styles.generateButton, isGenerating && styles.disabledButton]} 
            onPress={generateRecipes}
            disabled={isGenerating}
          >
            <MaterialIcons name="restaurant-menu" size={24} color="white" />
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Tarifler Oluşturuluyor...' : 'Tarif Oluştur'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Generated Recipes */}
        {generatedRecipes.length > 0 && (
          <View style={styles.recipesContainer}>
            <Text style={styles.sectionTitle}>Önerilen Tarifler</Text>
            {generatedRecipes.map((recipe: GeneratedRecipe) => (
              <View key={recipe.id} style={styles.recipeCard}>
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                <View style={styles.recipeInfo}>
                  <View style={styles.infoItem}>
                    <MaterialIcons name="local-fire-department" size={16} color={colors.error} />
                    <Text style={styles.infoText}>{recipe.calories} kalori</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <MaterialIcons name="schedule" size={16} color={colors.primary[500]} />
                    <Text style={styles.infoText}>{recipe.prepTime} dk</Text>
                  </View>
                </View>
                <Text style={styles.ingredientsTitle}>Malzemeler:</Text>
                <Text style={styles.ingredientsText}>{recipe.ingredients.join(', ')}</Text>
                <Text style={styles.instructionsTitle}>Hazırlık:</Text>
                {recipe.instructions.map((instruction: string, index: number) => (
                  <Text key={index} style={styles.instructionText}>
                    {index + 1}. {instruction}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Popular Recipes */}
        <View style={styles.popularContainer}>
          <Text style={styles.sectionTitle}>Popüler Tarifler</Text>
          <View style={styles.popularGrid}>
            <TouchableOpacity style={styles.popularCard}>
              <MaterialIcons name="restaurant" size={32} color={colors.primary[500]} />
              <Text style={styles.popularTitle}>Sağlıklı Kahvaltı</Text>
              <Text style={styles.popularCalories}>280 kalori</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popularCard}>
              <MaterialIcons name="local-pizza" size={32} color={colors.warning} />
              <Text style={styles.popularTitle}>Fit Pizza</Text>
              <Text style={styles.popularCalories}>350 kalori</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popularCard}>
              <MaterialIcons name="cake" size={32} color={colors.secondary[500]} />
              <Text style={styles.popularTitle}>Protein Bar</Text>
              <Text style={styles.popularCalories}>200 kalori</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popularCard}>
              <MaterialIcons name="local-drink" size={32} color={colors.info} />
              <Text style={styles.popularTitle}>Smoothie</Text>
              <Text style={styles.popularCalories}>150 kalori</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  inputContainer: {
    margin: spacing.md,
    backgroundColor: 'white',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    color: colors.text.primary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  generateButton: {
    backgroundColor: colors.primary[500],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
  },
  recipesContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: colors.text.primary,
  },
  recipeCard: {
    backgroundColor: 'white',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  recipeInfo: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoText: {
    marginLeft: spacing.xs,
    fontSize: 14,
    color: colors.text.secondary,
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  ingredientsText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  instructionText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 3,
  },
  popularContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  popularCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  popularTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  popularCalories: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});
