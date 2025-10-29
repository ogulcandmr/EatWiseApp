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

const GOAL_OPTIONS = [
  { value: 'weight_loss', label: 'Kilo Verme', icon: 'trending-down', color: '#E74C3C' },
  { value: 'weight_gain', label: 'Kilo Alma', icon: 'trending-up', color: '#2ECC71' },
  { value: 'maintenance', label: 'Koruma', icon: 'remove', color: '#3498DB' },
  { value: 'muscle_gain', label: 'Kas Kazanımı', icon: 'fitness', color: '#9B59B6' },
] as const;

interface PlanInfoFormProps {
  isDark: boolean;
  planName: string;
  setPlanName: (name: string) => void;
  goal: string;
  setGoal: (goal: string) => void;
  dailyCalories: string;
  setDailyCalories: (calories: string) => void;
  dailyProtein: string;
  setDailyProtein: (protein: string) => void;
  dailyCarbs: string;
  setDailyCarbs: (carbs: string) => void;
  dailyFat: string;
  setDailyFat: (fat: string) => void;
  goalOptions: readonly { value: string; label: string; }[];
  styles: any;
  onCalculateAI?: () => void;
}

export default function PlanInfoForm({
  isDark,
  planName,
  setPlanName,
  goal,
  setGoal,
  dailyCalories,
  setDailyCalories,
  dailyProtein,
  setDailyProtein,
  dailyCarbs,
  setDailyCarbs,
  dailyFat,
  setDailyFat,
  styles,
  onCalculateAI,
}: PlanInfoFormProps) {
  return (
    <>
      {/* Plan Info Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
          Plan Bilgileri
        </Text>
        
        <LinearGradient
          colors={isDark ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']}
          style={styles.card}
        >
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
              Plan Adı
            </Text>
            <TextInput
              style={[styles.input, { 
                color: isDark ? '#FFFFFF' : '#2C3E50',
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
              }]}
              placeholder="Örn: Kilo Verme Planım"
              placeholderTextColor={isDark ? '#888888' : '#999999'}
              value={planName}
              onChangeText={setPlanName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
              Hedef
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalContainer}>
              {GOAL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.goalChip,
                    goal === option.value && styles.goalChipActive,
                    { borderColor: option.color }
                  ]}
                  onPress={() => setGoal(option.value)}
                >
                  <Ionicons 
                    name={option.icon as any} 
                    size={16} 
                    color={goal === option.value ? option.color : (isDark ? '#888888' : '#999999')} 
                  />
                  <Text style={[
                    styles.goalChipText,
                    goal === option.value && { color: option.color },
                    { color: goal === option.value ? option.color : (isDark ? '#FFFFFF' : '#2C3E50') }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </LinearGradient>
      </View>

      {/* Nutrition Targets Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
            Günlük Hedefler
          </Text>
          {onCalculateAI && (
            <TouchableOpacity 
              style={styles.aiButton}
              onPress={onCalculateAI}
            >
              <Ionicons name="sparkles" size={14} color="white" />
              <Text style={styles.aiButtonText}>AI</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <LinearGradient
          colors={isDark ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']}
          style={styles.card}
        >
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                Kalori
              </Text>
              <TextInput
                style={[styles.input, { 
                  color: isDark ? '#FFFFFF' : '#2C3E50',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                }]}
                placeholder="2000"
                placeholderTextColor={isDark ? '#888888' : '#999999'}
                value={dailyCalories}
                onChangeText={setDailyCalories}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.nutritionItem}>
              <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                Protein (g)
              </Text>
              <TextInput
                style={[styles.input, { 
                  color: isDark ? '#FFFFFF' : '#2C3E50',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                }]}
                placeholder="100"
                placeholderTextColor={isDark ? '#888888' : '#999999'}
                value={dailyProtein}
                onChangeText={setDailyProtein}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.nutritionItem}>
              <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                Karbonhidrat (g)
              </Text>
              <TextInput
                style={[styles.input, { 
                  color: isDark ? '#FFFFFF' : '#2C3E50',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                }]}
                placeholder="250"
                placeholderTextColor={isDark ? '#888888' : '#999999'}
                value={dailyCarbs}
                onChangeText={setDailyCarbs}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.nutritionItem}>
              <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
                Yağ (g)
              </Text>
              <TextInput
                style={[styles.input, { 
                  color: isDark ? '#FFFFFF' : '#2C3E50',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                }]}
                placeholder="70"
                placeholderTextColor={isDark ? '#888888' : '#999999'}
                value={dailyFat}
                onChangeText={setDailyFat}
                keyboardType="numeric"
              />
            </View>
          </View>
        </LinearGradient>
      </View>
    </>
  );
}