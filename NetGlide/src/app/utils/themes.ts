export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    background: string;
    backgroundGradientFrom: string;
    backgroundGradientTo: string;
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    text: string;
    textSecondary: string;
    border: string;
    glow: string;
    cardBg: string;
    cardBorder: string;
  };
  particleColor: string;
}

export const THEMES: Theme[] = [
  {
    id: 'gx-neon',
    name: 'GX Default Neon',
    description: 'Classic Opera GX inspired purple neon',
    colors: {
      background: '#0a0a0f',
      backgroundGradientFrom: 'rgb(88, 28, 135)', // purple-900
      backgroundGradientTo: 'rgb(30, 58, 138)', // blue-900
      primary: 'rgb(168, 85, 247)', // purple-500
      primaryDark: 'rgb(147, 51, 234)', // purple-600
      secondary: 'rgb(59, 130, 246)', // blue-500
      accent: 'rgb(168, 85, 247)',
      text: '#ffffff',
      textSecondary: 'rgb(209, 213, 219)', // gray-300
      border: 'rgba(168, 85, 247, 0.3)',
      glow: 'rgba(168, 85, 247, 0.5)',
      cardBg: 'rgba(17, 24, 39, 0.95)', // gray-900
      cardBorder: 'rgba(168, 85, 247, 0.3)',
    },
    particleColor: '#a855f7',
  },
  {
    id: 'cyber-purple',
    name: 'Cyber Purple',
    description: 'Deep purple with pink accents',
    colors: {
      background: '#0f0a1a',
      backgroundGradientFrom: 'rgb(109, 40, 217)', // violet-700
      backgroundGradientTo: 'rgb(126, 34, 206)', // purple-700
      primary: 'rgb(192, 132, 252)', // purple-400
      primaryDark: 'rgb(168, 85, 247)', // purple-500
      secondary: 'rgb(232, 121, 249)', // fuchsia-400
      accent: 'rgb(232, 121, 249)',
      text: '#ffffff',
      textSecondary: 'rgb(216, 180, 254)', // purple-300
      border: 'rgba(192, 132, 252, 0.3)',
      glow: 'rgba(192, 132, 252, 0.6)',
      cardBg: 'rgba(24, 12, 42, 0.95)',
      cardBorder: 'rgba(192, 132, 252, 0.3)',
    },
    particleColor: '#c084fc',
  },
  {
    id: 'electric-blue',
    name: 'Electric Blue',
    description: 'Vibrant cyan and electric blue',
    colors: {
      background: '#0a0f1a',
      backgroundGradientFrom: 'rgb(3, 105, 161)', // sky-700
      backgroundGradientTo: 'rgb(29, 78, 216)', // blue-700
      primary: 'rgb(56, 189, 248)', // sky-400
      primaryDark: 'rgb(14, 165, 233)', // sky-500
      secondary: 'rgb(96, 165, 250)', // blue-400
      accent: 'rgb(34, 211, 238)', // cyan-400
      text: '#ffffff',
      textSecondary: 'rgb(186, 230, 253)', // sky-200
      border: 'rgba(56, 189, 248, 0.3)',
      glow: 'rgba(56, 189, 248, 0.6)',
      cardBg: 'rgba(8, 47, 73, 0.95)',
      cardBorder: 'rgba(56, 189, 248, 0.3)',
    },
    particleColor: '#38bdf8',
  },
  {
    id: 'lava-red',
    name: 'Lava Red',
    description: 'Intense red with orange glow',
    colors: {
      background: '#1a0a0a',
      backgroundGradientFrom: 'rgb(185, 28, 28)', // red-700
      backgroundGradientTo: 'rgb(180, 83, 9)', // orange-700
      primary: 'rgb(248, 113, 113)', // red-400
      primaryDark: 'rgb(239, 68, 68)', // red-500
      secondary: 'rgb(251, 146, 60)', // orange-400
      accent: 'rgb(252, 165, 165)', // red-300
      text: '#ffffff',
      textSecondary: 'rgb(254, 202, 202)', // red-200
      border: 'rgba(248, 113, 113, 0.3)',
      glow: 'rgba(248, 113, 113, 0.6)',
      cardBg: 'rgba(69, 10, 10, 0.95)',
      cardBorder: 'rgba(248, 113, 113, 0.3)',
    },
    particleColor: '#f87171',
  },
  {
    id: 'midnight-black',
    name: 'Midnight Black',
    description: 'Pure dark with subtle purple hints',
    colors: {
      background: '#000000',
      backgroundGradientFrom: 'rgb(17, 24, 39)', // gray-900
      backgroundGradientTo: 'rgb(31, 41, 55)', // gray-800
      primary: 'rgb(156, 163, 175)', // gray-400
      primaryDark: 'rgb(107, 114, 128)', // gray-500
      secondary: 'rgb(209, 213, 219)', // gray-300
      accent: 'rgb(139, 92, 246)', // violet-500
      text: '#ffffff',
      textSecondary: 'rgb(209, 213, 219)', // gray-300
      border: 'rgba(156, 163, 175, 0.3)',
      glow: 'rgba(139, 92, 246, 0.4)',
      cardBg: 'rgba(17, 24, 39, 0.95)',
      cardBorder: 'rgba(156, 163, 175, 0.2)',
    },
    particleColor: '#9ca3af',
  },
  {
    id: 'sakura-pink',
    name: 'Sakura Pink',
    description: 'Soft pink with purple undertones',
    colors: {
      background: '#1a0a14',
      backgroundGradientFrom: 'rgb(157, 23, 77)', // pink-800
      backgroundGradientTo: 'rgb(131, 24, 67)', // pink-900
      primary: 'rgb(244, 114, 182)', // pink-400
      primaryDark: 'rgb(236, 72, 153)', // pink-500
      secondary: 'rgb(232, 121, 249)', // fuchsia-400
      accent: 'rgb(249, 168, 212)', // pink-300
      text: '#ffffff',
      textSecondary: 'rgb(251, 207, 232)', // pink-200
      border: 'rgba(244, 114, 182, 0.3)',
      glow: 'rgba(244, 114, 182, 0.6)',
      cardBg: 'rgba(39, 7, 24, 0.95)',
      cardBorder: 'rgba(244, 114, 182, 0.3)',
    },
    particleColor: '#f472b6',
  },
  {
    id: 'toxic-green',
    name: 'Toxic Green',
    description: 'Radioactive green with lime accents',
    colors: {
      background: '#0a1a0a',
      backgroundGradientFrom: 'rgb(21, 128, 61)', // green-700
      backgroundGradientTo: 'rgb(22, 163, 74)', // green-600
      primary: 'rgb(74, 222, 128)', // green-400
      primaryDark: 'rgb(34, 197, 94)', // green-500
      secondary: 'rgb(163, 230, 53)', // lime-400
      accent: 'rgb(132, 204, 22)', // lime-500
      text: '#ffffff',
      textSecondary: 'rgb(187, 247, 208)', // green-200
      border: 'rgba(74, 222, 128, 0.3)',
      glow: 'rgba(74, 222, 128, 0.6)',
      cardBg: 'rgba(5, 46, 22, 0.95)',
      cardBorder: 'rgba(74, 222, 128, 0.3)',
    },
    particleColor: '#4ade80',
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    description: 'Dark blue nebula with star accents',
    colors: {
      background: '#0a0a1a',
      backgroundGradientFrom: 'rgb(30, 27, 75)', // indigo-950
      backgroundGradientTo: 'rgb(15, 23, 42)', // slate-900
      primary: 'rgb(129, 140, 248)', // indigo-400
      primaryDark: 'rgb(99, 102, 241)', // indigo-500
      secondary: 'rgb(147, 197, 253)', // blue-300
      accent: 'rgb(167, 139, 250)', // violet-400
      text: '#ffffff',
      textSecondary: 'rgb(199, 210, 254)', // indigo-200
      border: 'rgba(129, 140, 248, 0.3)',
      glow: 'rgba(129, 140, 248, 0.6)',
      cardBg: 'rgba(30, 27, 75, 0.95)',
      cardBorder: 'rgba(129, 140, 248, 0.3)',
    },
    particleColor: '#818cf8',
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    description: 'Warm orange and amber sunset',
    colors: {
      background: '#1a0f0a',
      backgroundGradientFrom: 'rgb(194, 65, 12)', // orange-800
      backgroundGradientTo: 'rgb(146, 64, 14)', // amber-800
      primary: 'rgb(251, 146, 60)', // orange-400
      primaryDark: 'rgb(249, 115, 22)', // orange-500
      secondary: 'rgb(251, 191, 36)', // amber-400
      accent: 'rgb(252, 211, 77)', // amber-300
      text: '#ffffff',
      textSecondary: 'rgb(254, 215, 170)', // orange-200
      border: 'rgba(251, 146, 60, 0.3)',
      glow: 'rgba(251, 146, 60, 0.6)',
      cardBg: 'rgba(69, 26, 3, 0.95)',
      cardBorder: 'rgba(251, 146, 60, 0.3)',
    },
    particleColor: '#fb923c',
  },
];

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  
  // Apply CSS custom properties
  root.style.setProperty('--theme-bg', theme.colors.background);
  root.style.setProperty('--theme-bg-gradient-from', theme.colors.backgroundGradientFrom);
  root.style.setProperty('--theme-bg-gradient-to', theme.colors.backgroundGradientTo);
  root.style.setProperty('--theme-primary', theme.colors.primary);
  root.style.setProperty('--theme-primary-dark', theme.colors.primaryDark);
  root.style.setProperty('--theme-secondary', theme.colors.secondary);
  root.style.setProperty('--theme-accent', theme.colors.accent);
  root.style.setProperty('--theme-text', theme.colors.text);
  root.style.setProperty('--theme-text-secondary', theme.colors.textSecondary);
  root.style.setProperty('--theme-border', theme.colors.border);
  root.style.setProperty('--theme-glow', theme.colors.glow);
  root.style.setProperty('--theme-card-bg', theme.colors.cardBg);
  root.style.setProperty('--theme-card-border', theme.colors.cardBorder);
  root.style.setProperty('--theme-particle', theme.particleColor);
}
