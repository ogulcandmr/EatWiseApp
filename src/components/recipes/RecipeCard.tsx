import React from 'react';
import { TouchableOpacity, View, Image, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecipeDb } from '../../services/recipeDbService';

interface RecipeCardProps {
  item: RecipeDb;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ item, isFavorite, onPress, onToggleFavorite }) => {
  return (
    <TouchableOpacity style={styles.recipeCard} onPress={onPress}>
      <View style={styles.cardContent}>
        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.recipeImage} />
        )}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={onToggleFavorite}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? '#FF6B6B' : '#666'}
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
};

const styles = StyleSheet.create({
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
    zIndex: 1,
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
});