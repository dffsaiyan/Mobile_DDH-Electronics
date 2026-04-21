export const Colors = {
  primary: '#0f172a',       // Deep Midnight
  primarySoft: '#1e293b',
  secondary: '#f97316',     // Vibrant Orange
  secondarySoft: '#fff7ed',
  accent: '#fbbf24',        // Elite Gold
  white: '#ffffff',
  black: '#000000',
  gray: '#f8fafc',
  muted: '#64748b',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  dark: '#0f172a',          // Alias for primary
  light: '#f8fafc',         // Alias for gray
  
  // Premium Gradients (Simulated via colors)
  bgGradient: ['#ffffff', '#f8fafc'],
  cardGradient: ['#ffffff', '#f1f5f9'],
};

export const Spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const Shadow = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 15,
  },
  premium: {
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  }
};
