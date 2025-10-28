// Modern Color Palette - EatWise
export const colors = {
  // Primary - Emerald Green (Sağlık, Doğa)
  primary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Secondary - Teal
  secondary: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },

  // Neutral - Gri Tonları
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Semantic Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Nutrition Colors
  calories: '#F59E0B',
  protein: '#8B5CF6',
  carbs: '#3B82F6',
  fats: '#EF4444',

  // Background
  background: '#FAFAFA',
  card: '#FFFFFF',
  
  // Text
  text: {
    primary: '#262626',
    secondary: '#737373',
    tertiary: '#A3A3A3',
    inverse: '#FFFFFF',
  },

  // Dark Mode - Modern & Professional
  dark: {
    // Backgrounds
    background: '#121212',        // Ana arka plan (Material Design Dark)
    backgroundElevated: '#1E1E1E', // Yükseltilmiş yüzeyler
    surface: '#1F1F1F',           // Kart yüzeyleri
    surfaceElevated: '#2A2A2A',   // Hover/Active durumlar
    
    // Text
    text: {
      primary: '#E0E0E0',         // Ana metin (yüksek kontrast, göz yormayan)
      secondary: '#B0B0B0',       // İkincil metin
      tertiary: '#808080',        // Üçüncül metin
      disabled: '#5A5A5A',        // Devre dışı metin
      inverse: '#121212',         // Ters metin (açık butonlarda)
    },
    
    // Accent Colors
    primary: '#3B82F6',           // Mavi accent
    primaryLight: '#60A5FA',      // Açık mavi
    primaryDark: '#2563EB',       // Koyu mavi
    
    secondary: '#8B5CF6',         // Mor accent
    secondaryLight: '#A78BFA',    // Açık mor
    secondaryDark: '#7C3AED',     // Koyu mor
    
    // Semantic Colors (Dark mode için optimize)
    success: '#10B981',
    successLight: '#34D399',
    warning: '#F59E0B',
    warningLight: '#FBBF24',
    error: '#EF4444',
    errorLight: '#F87171',
    info: '#3B82F6',
    infoLight: '#60A5FA',
    
    // Borders & Dividers
    border: '#2A2A2A',
    borderLight: '#333333',
    divider: '#2A2A2A',
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.7)',
    scrim: 'rgba(0, 0, 0, 0.5)',
    
    // Shadows (dark mode için subtle)
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
};

// Gradients
export const gradients = {
  primary: ['#10B981', '#059669'],
  secondary: ['#14B8A6', '#0D9488'],
  success: ['#10B981', '#047857'],
  warning: ['#F59E0B', '#D97706'],
  error: ['#EF4444', '#DC2626'],
  info: ['#3B82F6', '#2563EB'],
  purple: ['#8B5CF6', '#7C3AED'],
  pink: ['#EC4899', '#DB2777'],
};
