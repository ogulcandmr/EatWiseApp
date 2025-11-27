import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecipeDb } from '../../services/recipeDbService';

interface RecipeDetailModalProps {
  visible: boolean;
  recipe: RecipeDb | null;
  favorites: string[];
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onAddToPlanPress: () => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  visible,
  recipe,
  favorites,
  onClose,
  onToggleFavorite,
  onAddToPlanPress
}) => {
  if (!recipe) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Tarif Detayı</Text>
          <TouchableOpacity style={styles.addToPlanModalButton} onPress={onAddToPlanPress}>
            <Ionicons name="add" size={24} color="#10B981" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {recipe.image_url && (
            <Image source={{ uri: recipe.image_url }} style={styles.modalRecipeImage} />
          )}

          <View style={styles.modalRecipeInfo}>
            <Text style={styles.modalRecipeTitle}>{recipe.title}</Text>

            <View style={styles.modalRecipeTags}>
              <View style={styles.modalTag}>
                <Text style={styles.modalTagText}>{recipe.cuisine}</Text>
              </View>
              <View style={styles.modalTag}>
                <Text style={styles.modalTagText}>{recipe.time_minutes} dk</Text>
              </View>
              <View style={styles.modalTag}>
                <Text style={styles.modalTagText}>{recipe.diet_type}</Text>
              </View>
            </View>

            <View style={styles.modalNutritionInfo}>
              <View style={styles.modalNutritionItem}>
                <Text style={styles.modalNutritionValue}>{recipe.calories}</Text>
                <Text style={styles.modalNutritionLabel}>kcal</Text>
              </View>
              <View style={styles.modalNutritionItem}>
                <Text style={styles.modalNutritionValue}>{recipe.protein}g</Text>
                <Text style={styles.modalNutritionLabel}>Protein</Text>
              </View>
              <View style={styles.modalNutritionItem}>
                <Text style={styles.modalNutritionValue}>{recipe.carbs}g</Text>
                <Text style={styles.modalNutritionLabel}>Carb</Text>
              </View>
              <View style={styles.modalNutritionItem}>
                <Text style={styles.modalNutritionValue}>{recipe.fats}g</Text>
                <Text style={styles.modalNutritionLabel}>Yağ</Text>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Malzemeler</Text>
              {recipe.ingredients.map((ingredient, index) => (
                <Text key={index} style={styles.modalIngredient}>• {ingredient}</Text>
              ))}
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Hazırlanış</Text>
              {recipe.steps.map((step, index) => (
                <Text key={index} style={styles.modalStep}>{index + 1}. {step}</Text>
              ))}
            </View>

            <TouchableOpacity
              style={styles.favoriteModalButton}
              onPress={() => onToggleFavorite(recipe.id)}
            >
              <Ionicons
                name={favorites.includes(recipe.id) ? 'heart' : 'heart-outline'}
                size={24}
                color={favorites.includes(recipe.id) ? '#FF6B6B' : '#666'}
              />
              <Text style={styles.favoriteModalButtonText}>
                {favorites.includes(recipe.id) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: 'white' },
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
  modalCloseButton: { padding: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  addToPlanModalButton: { padding: 5 },
  modalContent: { flex: 1 },
  modalRecipeImage: { width: '100%', height: 250, backgroundColor: '#f5f5f5' },
  modalRecipeInfo: { padding: 20 },
  modalRecipeTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  modalRecipeTags: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  modalTag: { backgroundColor: '#f0f9ff', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  modalTagText: { fontSize: 14, color: '#0369a1' },
  modalNutritionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
  },
  modalNutritionItem: { alignItems: 'center' },
  modalNutritionValue: { fontSize: 20, fontWeight: 'bold', color: '#10B981' },
  modalNutritionLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  modalSection: { marginBottom: 25 },
  modalSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  modalIngredient: { fontSize: 16, color: '#666', marginBottom: 8, lineHeight: 24 },
  modalStep: { fontSize: 16, color: '#666', marginBottom: 12, lineHeight: 24 },
  favoriteModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    gap: 10,
  },
  favoriteModalButtonText: { fontSize: 16, fontWeight: '600', color: '#333' },
});