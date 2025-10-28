import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MealService } from '../services/mealService';

interface AddMealModalProps {
  visible: boolean;
  onClose: () => void;
  onMealAdded: () => void;
  userId: string;
}

export default function AddMealModal({ visible, onClose, onMealAdded, userId }: AddMealModalProps) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [portion, setPortion] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [loading, setLoading] = useState(false);

  const mealTypes = [
    { value: 'breakfast' as const, label: 'Kahvaltı', icon: '🌅' },
    { value: 'lunch' as const, label: 'Öğle', icon: '🌞' },
    { value: 'dinner' as const, label: 'Akşam', icon: '🌙' },
    { value: 'snack' as const, label: 'Atıştırmalık', icon: '🍎' }
  ];

  const resetForm = () => {
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setPortion('');
    setMealType('lunch');
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen öğün adını girin');
      return false;
    }

    const caloriesNum = parseFloat(calories);
    if (!calories || isNaN(caloriesNum) || caloriesNum < 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir kalori değeri girin');
      return false;
    }

    const proteinNum = parseFloat(protein);
    if (!protein || isNaN(proteinNum) || proteinNum < 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir protein değeri girin');
      return false;
    }

    const carbsNum = parseFloat(carbs);
    if (!carbs || isNaN(carbsNum) || carbsNum < 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir karbonhidrat değeri girin');
      return false;
    }

    const fatNum = parseFloat(fat);
    if (!fat || isNaN(fatNum) || fatNum < 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir yağ değeri girin');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await MealService.addMeal({
        user_id: userId,
        name: name.trim(),
        total_calories: parseFloat(calories),
        total_protein: parseFloat(protein),
        total_carbs: parseFloat(carbs),
        total_fat: parseFloat(fat),
        meal_type: mealType,
        portion: portion.trim() || undefined
      });

      Alert.alert('Başarılı', 'Öğün eklendi!');
      resetForm();
      onMealAdded();
      onClose();
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Öğün eklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Öğün Ekle</Text>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#4CAF50" />
              ) : (
                <MaterialIcons name="check" size={24} color="#4CAF50" />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Öğün Adı */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Öğün Adı *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Örn: Tavuklu Salata"
                placeholderTextColor="#999"
              />
            </View>

            {/* Öğün Tipi */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Öğün Tipi *</Text>
              <View style={styles.mealTypeGrid}>
                {mealTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.mealTypeButton,
                      mealType === type.value && styles.mealTypeButtonActive
                    ]}
                    onPress={() => setMealType(type.value)}
                  >
                    <Text style={styles.mealTypeIcon}>{type.icon}</Text>
                    <Text
                      style={[
                        styles.mealTypeLabel,
                        mealType === type.value && styles.mealTypeLabelActive
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Kalori */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kalori (kcal) *</Text>
              <TextInput
                style={styles.input}
                value={calories}
                onChangeText={setCalories}
                placeholder="0"
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />
            </View>

            {/* Makrolar */}
            <View style={styles.macrosContainer}>
              <View style={styles.macroInput}>
                <Text style={styles.label}>Protein (g) *</Text>
                <TextInput
                  style={styles.input}
                  value={protein}
                  onChangeText={setProtein}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.macroInput}>
                <Text style={styles.label}>Karbonhidrat (g) *</Text>
                <TextInput
                  style={styles.input}
                  value={carbs}
                  onChangeText={setCarbs}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.macroInput}>
                <Text style={styles.label}>Yağ (g) *</Text>
                <TextInput
                  style={styles.input}
                  value={fat}
                  onChangeText={setFat}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Porsiyon (Opsiyonel) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Porsiyon (Opsiyonel)</Text>
              <TextInput
                style={styles.input}
                value={portion}
                onChangeText={setPortion}
                placeholder="Örn: 1 porsiyon, 200g"
                placeholderTextColor="#999"
              />
            </View>

            {/* Özet */}
            {calories && protein && carbs && fat && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Özet</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Toplam Kalori:</Text>
                  <Text style={styles.summaryValue}>{calories} kcal</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Protein:</Text>
                  <Text style={styles.summaryValue}>{protein}g ({Math.round((parseFloat(protein) * 4 / parseFloat(calories)) * 100)}%)</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Karbonhidrat:</Text>
                  <Text style={styles.summaryValue}>{carbs}g ({Math.round((parseFloat(carbs) * 4 / parseFloat(calories)) * 100)}%)</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Yağ:</Text>
                  <Text style={styles.summaryValue}>{fat}g ({Math.round((parseFloat(fat) * 9 / parseFloat(calories)) * 100)}%)</Text>
                </View>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 5,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    padding: 5,
    width: 40,
    alignItems: 'flex-end',
  },
  scrollView: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
  mealTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mealTypeButton: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  mealTypeButtonActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
  },
  mealTypeIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  mealTypeLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  mealTypeLabelActive: {
    color: '#4CAF50',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  macroInput: {
    width: '31%',
  },
  summaryCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});
