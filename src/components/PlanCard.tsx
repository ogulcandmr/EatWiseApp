import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DietPlan, PlanService } from '../services/planService';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

interface PlanCardProps {
  plan: DietPlan;
  onEdit: (plan: DietPlan) => void;
  onViewProgress: (plan: DietPlan) => void;
  onViewDetail?: (plan: DietPlan) => void;
  onActivate?: (planId: string) => void;
  onDelete?: (planId: string) => void;
  showActions?: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  onEdit,
  onViewProgress,
  onViewDetail,
  onActivate,
  onDelete,
  showActions = true,
}) => {
  const { isDark } = useTheme();

  const getGoalIcon = (goal: string) => {
    switch (goal) {
      case 'weight_loss':
        return 'trending-down';
      case 'weight_gain':
        return 'trending-up';
      case 'muscle_gain':
        return 'fitness';
      case 'maintenance':
        return 'remove';
      default:
        return 'nutrition';
    }
  };

  const getGoalColor = (goal: string) => {
    switch (goal) {
      case 'weight_loss':
        return ['#FF6B6B', '#FF8E8E'];
      case 'weight_gain':
        return ['#4ECDC4', '#44A08D'];
      case 'muscle_gain':
        return ['#A8E6CF', '#7FCDCD'];
      case 'maintenance':
        return ['#FFD93D', '#6BCF7F'];
      default:
        return ['#667eea', '#764ba2'];
    }
  };

  const goalColors = getGoalColor(plan.goal);

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <LinearGradient
        colors={isDark ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']}
        style={styles.card}
      >
        {/* Header with Goal Badge */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
              {plan.name}
            </Text>
            {plan.is_active && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Aktif</Text>
              </View>
            )}
          </View>
          
          <LinearGradient
            colors={goalColors as any}
            style={styles.goalBadge}
          >
            <Ionicons 
              name={getGoalIcon(plan.goal) as any} 
              size={16} 
              color="white" 
            />
            <Text style={styles.goalText}>
              {PlanService.getGoalDisplayText(plan.goal)}
            </Text>
          </LinearGradient>
        </View>

        {/* Nutrition Summary */}
        <View style={styles.nutritionContainer}>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
              {plan.daily_calories}
            </Text>
            <Text style={[styles.nutritionLabel, { color: isDark ? '#B0B0B0' : '#7F8C8D' }]}>
              Kalori
            </Text>
          </View>
          
          <View style={styles.nutritionDivider} />
          
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
              {plan.daily_protein}g
            </Text>
            <Text style={[styles.nutritionLabel, { color: isDark ? '#B0B0B0' : '#7F8C8D' }]}>
              Protein
            </Text>
          </View>
          
          <View style={styles.nutritionDivider} />
          
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
              {plan.daily_carbs}g
            </Text>
            <Text style={[styles.nutritionLabel, { color: isDark ? '#B0B0B0' : '#7F8C8D' }]}>
              Karb
            </Text>
          </View>
          
          <View style={styles.nutritionDivider} />
          
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}>
              {plan.daily_fat}g
            </Text>
            <Text style={[styles.nutritionLabel, { color: isDark ? '#B0B0B0' : '#7F8C8D' }]}>
              Yağ
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {showActions && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => onEdit(plan)}
            >
              <Ionicons name="create-outline" size={18} color="#667eea" />
              <Text style={styles.editButtonText}>Düzenle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.progressButton]}
              onPress={() => onViewProgress(plan)}
            >
              <Ionicons name="analytics-outline" size={18} color="#4ECDC4" />
              <Text style={styles.progressButtonText}>İlerleme</Text>
            </TouchableOpacity>

            {onViewDetail && (
              <TouchableOpacity
                style={[styles.actionButton, styles.detailButton]}
                onPress={() => onViewDetail(plan)}
              >
                <Ionicons name="list-outline" size={18} color="#9B59B6" />
                <Text style={styles.detailButtonText}>Detaylı</Text>
              </TouchableOpacity>
            )}

            {!plan.is_active && onActivate && (
              <TouchableOpacity
                style={[styles.actionButton, styles.activateButton]}
                onPress={() => onActivate(plan.id!)}
              >
                <Ionicons name="play-outline" size={18} color="#2ECC71" />
                <Text style={styles.activateButtonText}>Aktifleştir</Text>
              </TouchableOpacity>
            )}

            {onDelete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => onDelete(plan.id!)}
              >
                <Ionicons name="trash-outline" size={18} color="#E74C3C" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Creation Date */}
        <Text style={[styles.dateText, { color: isDark ? '#B0B0B0' : '#95A5A6' }]}>
          {plan.created_at ? new Date(plan.created_at).toLocaleDateString('tr-TR') : ''}
        </Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  containerDark: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  activeBadge: {
    backgroundColor: '#2ECC71',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  goalText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  nutritionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  nutritionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  nutritionDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
  },
  editButton: {
    borderColor: '#667eea',
  },
  editButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressButton: {
    borderColor: '#4ECDC4',
  },
  progressButtonText: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  detailButton: {
    borderColor: '#9B59B6',
  },
  detailButtonText: {
    color: '#9B59B6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  activateButton: {
    borderColor: '#2ECC71',
  },
  activateButtonText: {
    color: '#2ECC71',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteButton: {
    borderColor: '#E74C3C',
    paddingHorizontal: 8,
  },
  dateText: {
    fontSize: 12,
    textAlign: 'right',
    fontWeight: '500',
  },
});