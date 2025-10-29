import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PlanEditHeaderProps {
  onNavigateBack?: () => void;
  isDark: boolean;
  planName: string;
  styles: any;
}

export default function PlanEditHeader({
  onNavigateBack,
  isDark,
  planName,
  styles,
}: PlanEditHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => onNavigateBack?.()}
      >
        <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#2C3E50'} />
      </TouchableOpacity>
      
      <View style={styles.headerContent}>
        <Text 
          style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#2C3E50' }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {planName || 'Plan Düzenle'}
        </Text>
      </View>
    </View>
  );
}