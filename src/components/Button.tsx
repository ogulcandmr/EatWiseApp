import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: keyof typeof MaterialIcons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
}

export default function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  icon, 
  disabled = false,
  loading = false 
}: ButtonProps) {
  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return [styles.button, styles.secondaryButton];
      case 'outline':
        return [styles.button, styles.outlineButton];
      default:
        return [styles.button, styles.primaryButton];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return [styles.buttonText, styles.secondaryText];
      case 'outline':
        return [styles.buttonText, styles.outlineText];
      default:
        return [styles.buttonText, styles.primaryText];
    }
  };

  return (
    <TouchableOpacity
      style={[
        ...getButtonStyle(),
        disabled && styles.disabledButton
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {icon && !loading && (
        <MaterialIcons 
          name={icon} 
          size={20} 
          color={variant === 'outline' ? '#4CAF50' : 'white'} 
          style={styles.icon}
        />
      )}
      {loading && (
        <MaterialIcons 
          name="hourglass-empty" 
          size={20} 
          color="white" 
          style={styles.icon}
        />
      )}
      <Text style={getTextStyle()}>
        {loading ? 'Yükleniyor...' : title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: '#2196F3',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    borderColor: '#ccc',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryText: {
    color: 'white',
  },
  secondaryText: {
    color: 'white',
  },
  outlineText: {
    color: '#4CAF50',
  },
  icon: {
    marginRight: 8,
  },
});
