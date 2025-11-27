import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface AddToPlanModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (day: string, mealType: string) => void;
}

export const AddToPlanModal: React.FC<AddToPlanModalProps> = ({ visible, onClose, onConfirm }) => {
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedMealType, setSelectedMealType] = useState<string>('');

  const handleConfirm = () => {
    if (selectedDay && selectedMealType) {
      onConfirm(selectedDay, selectedMealType);
      // Reset after confirm
      setSelectedDay('');
      setSelectedMealType('');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.addToPlanModalContainer}>
        <BlurView intensity={20} style={styles.addToPlanModalBlur}>
          <View style={styles.addToPlanModalContent}>
            <View style={styles.addToPlanModalHeader}>
              <Text style={styles.addToPlanModalTitle}>Plana Ekle</Text>
              <TouchableOpacity style={styles.addToPlanModalCloseButton} onPress={onClose}>
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

              <TouchableOpacity style={styles.addToPlanSubmitButton} onPress={handleConfirm}>
                <Text style={styles.addToPlanSubmitButtonText}>Plana Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  addToPlanModalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  addToPlanModalBlur: { flex: 1, justifyContent: 'flex-end' },
  addToPlanModalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  addToPlanModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  addToPlanModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  addToPlanModalCloseButton: { padding: 5 },
  addToPlanForm: { padding: 20 },
  addToPlanFormGroup: { marginBottom: 25 },
  addToPlanFormLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 },
  addToPlanDayButton: { backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10 },
  addToPlanDayButtonActive: { backgroundColor: '#10B981' },
  addToPlanDayButtonText: { fontSize: 14, color: '#666' },
  addToPlanDayButtonTextActive: { color: 'white' },
  addToPlanMealButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  addToPlanMealButton: { backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10 },
  addToPlanMealButtonActive: { backgroundColor: '#10B981' },
  addToPlanMealButtonText: { fontSize: 14, color: '#666' },
  addToPlanMealButtonTextActive: { color: 'white' },
  addToPlanSubmitButton: { backgroundColor: '#10B981', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 20 },
  addToPlanSubmitButtonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
});