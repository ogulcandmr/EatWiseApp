import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthService } from '../services/authService';
import { colors, gradients, spacing, borderRadius, shadows, typography } from '../theme';

type AuthMode = 'login' | 'register';

const { width, height } = Dimensions.get('window');

export default function ModernAuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    try {
      const user = await AuthService.login(email, password);
      // Auth state değişecek, App.tsx otomatik yönlendirecek
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalı');
      return;
    }

    setLoading(true);
    try {
      await AuthService.register(email, password, name);
      Alert.alert('Başarılı', 'Hesabın oluşturuldu! Şimdi giriş yapabilirsin.');
      setMode('login');
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#10B981', '#059669', '#047857'] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>🍽️</Text>
          </View>
          <Text style={styles.logoText}>EatWise</Text>
          <Text style={styles.tagline}>AI Destekli Diyet Asistanı</Text>
        </View>

        {/* Auth Card */}
        <View style={styles.authCard}>
          {/* Mode Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, mode === 'login' && styles.activeTab]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>
                Giriş Yap
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'register' && styles.activeTab]}
              onPress={() => setMode('register')}
            >
              <Text style={[styles.tabText, mode === 'register' && styles.activeTabText]}>
                Kayıt Ol
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {mode === 'register' && (
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <MaterialIcons name="person" size={20} color={colors.neutral[400]} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Ad Soyad"
                  placeholderTextColor={colors.neutral[400]}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <MaterialIcons name="email" size={20} color={colors.neutral[400]} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="E-posta"
                placeholderTextColor={colors.neutral[400]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <MaterialIcons name="lock" size={20} color={colors.neutral[400]} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Şifre"
                placeholderTextColor={colors.neutral[400]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={colors.neutral[400]}
                />
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={mode === 'login' ? handleLogin : handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={gradients.primary as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'İşleniyor...' : mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {mode === 'login' && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.featureEmoji}>📸</Text>
            </View>
            <Text style={styles.featureText}>Fotoğrafla Analiz</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.featureEmoji}>🍽️</Text>
            </View>
            <Text style={styles.featureText}>Tarif Oluştur</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.featureEmoji}>🧠</Text>
            </View>
            <Text style={styles.featureText}>AI Diyet Planı</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.featureEmoji}>📊</Text>
            </View>
            <Text style={styles.featureText}>Sağlık Takibi</Text>
          </View>
        </View>

        {/* Terms */}
        <Text style={styles.termsText}>
          Devam ederek Kullanım Şartları ve Gizlilik Politikası'nı kabul etmiş olursun.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 40,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  authCard: {
    marginHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    ...shadows.xl,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: 'white',
    ...shadows.sm,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  activeTabText: {
    color: colors.primary[600],
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  eyeIcon: {
    padding: 4,
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    ...shadows.md,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
  },
  disabledButton: {
    opacity: 0.6,
  },
  forgotPassword: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '600',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginTop: 32,
    marginBottom: 24,
  },
  featureItem: {
    alignItems: 'center',
    width: 70,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginHorizontal: 40,
    lineHeight: 18,
  },
});
