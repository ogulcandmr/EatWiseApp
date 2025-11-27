import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Yeni oluşturduğumuz parçaları import ediyoruz
import { useExploreRecipes } from '../hooks/useExploreRecipes';
import { RecipeCard } from '../components/recipes/RecipeCard';
import { FilterSection } from '../components/recipes/FilterSection';
import { RecipeDetailModal } from '../components/modals/RecipeDetailModal';
import { AddToPlanModal } from '../components/modals/AddToPlanModal';
import { RecipeDb } from '../services/recipeDbService';

interface ExploreScreenProps {
  navigation?: {
    navigate: (screen: any, params?: any) => void;
    goBack: () => void;
  };
}

export default function ExploreScreen({ navigation }: ExploreScreenProps) {
  // Tüm mantığı hook'tan çekiyoruz
  const {
    filteredRecipes,
    loading,
    searchText,
    setSearchText,
    favorites,
    toggleFavorite,
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
    handleAddRecipeToPlan
  } = useExploreRecipes(navigation);

  // UI State'leri (Sadece bu sayfada gerekli olanlar)
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDb | null>(null);
  const [recipeDetailVisible, setRecipeDetailVisible] = useState(false);
  const [addToPlanVisible, setAddToPlanVisible] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#10B981', '#059669']} style={styles.header}>
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

      {/* Filter Component */}
      <FilterSection
        visible={showFilters}
        selectedCuisine={selectedCuisine}
        setSelectedCuisine={setSelectedCuisine}
        selectedDietType={selectedDietType}
        setSelectedDietType={setSelectedDietType}
        selectedTimeFilter={selectedTimeFilter}
        setSelectedTimeFilter={setSelectedTimeFilter}
        onClear={() => {
          clearFilters();
          setShowFilters(false);
        }}
        cuisines={cuisines}
        dietTypes={dietTypes}
        timeFilters={timeFilters}
      />

      {/* Recipe Grid */}
      <FlatList
        data={filteredRecipes}
        renderItem={({ item }) => (
          <RecipeCard
            item={item}
            isFavorite={favorites.includes(item.id)}
            onToggleFavorite={() => toggleFavorite(item.id)}
            onPress={() => {
              setSelectedRecipe(item);
              setRecipeDetailVisible(true);
            }}
          />
        )}
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

      {/* Modals */}
      <RecipeDetailModal
        visible={recipeDetailVisible}
        recipe={selectedRecipe}
        favorites={favorites}
        onClose={() => setRecipeDetailVisible(false)}
        onToggleFavorite={toggleFavorite}
        onAddToPlanPress={() => {
          setRecipeDetailVisible(false);
          setAddToPlanVisible(true);
        }}
      />

      <AddToPlanModal
        visible={addToPlanVisible}
        onClose={() => setAddToPlanVisible(false)}
        onConfirm={(day, mealType) => {
          if (selectedRecipe) {
            handleAddRecipeToPlan(selectedRecipe, day, mealType);
            setAddToPlanVisible(false);
          }
        }}
      />
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
  recipeGrid: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
});