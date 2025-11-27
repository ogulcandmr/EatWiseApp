import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

interface FilterSectionProps {
  visible: boolean;
  selectedCuisine: string;
  setSelectedCuisine: (val: string) => void;
  selectedDietType: string;
  setSelectedDietType: (val: string) => void;
  selectedTimeFilter: number | null;
  setSelectedTimeFilter: (val: number | null) => void;
  onClear: () => void;
  cuisines: string[];
  dietTypes: string[];
  timeFilters: { label: string; value: number }[];
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  visible,
  selectedCuisine,
  setSelectedCuisine,
  selectedDietType,
  setSelectedDietType,
  selectedTimeFilter,
  setSelectedTimeFilter,
  onClear,
  cuisines,
  dietTypes,
  timeFilters,
}) => {
  if (!visible) return null;

  return (
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
        <TouchableOpacity style={styles.clearButton} onPress={onClear}>
          <Text style={styles.clearButtonText}>Temizle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  filterRow: { gap: 15 },
  filterGroup: { marginBottom: 15 },
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
  filterChipText: { fontSize: 14, color: '#666' },
  filterChipTextActive: { color: 'white' },
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
  clearButtonText: { fontSize: 14, color: '#666' },
});