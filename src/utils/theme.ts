import type { BiomeType, SeasonName } from '../types';

export interface ThemeColors {
  // Background gradients
  bgStart: string;
  bgMid: string;
  bgEnd: string;

  // Accent colors
  accentPrimary: string;
  accentSecondary: string;

  // Glass tints
  glassBase: string; // Base tint for glass panels
}

// Season-based themes (used for Temperate biome)
const SEASON_THEMES: Record<SeasonName, ThemeColors> = {
  Spring: {
    bgStart: '#2d1b3d',     // Deep purple
    bgMid: '#3d2952',       // Purple-pink
    bgEnd: '#4a5f4f',       // Muted sage green
    accentPrimary: '#f9d71c', // Pastel yellow
    accentSecondary: '#e8b4f7', // Light lavender
    glassBase: 'rgba(249, 215, 28, 0.12)', // Yellow tint
  },
  Summer: {
    bgStart: '#1a2f1a',     // Deep forest green
    bgMid: '#2d4a2d',       // Medium green
    bgEnd: '#3d6b3d',       // Lighter green
    accentPrimary: '#4ade80', // Bright green
    accentSecondary: '#86efac', // Light green
    glassBase: 'rgba(74, 222, 128, 0.12)', // Green tint
  },
  Fall: {
    bgStart: '#2d1810',     // Deep brown
    bgMid: '#4a2810',       // Rust brown
    bgEnd: '#6b3810',       // Orange-brown
    accentPrimary: '#fb923c', // Orange
    accentSecondary: '#fbbf24', // Golden yellow
    glassBase: 'rgba(251, 146, 60, 0.12)', // Orange tint
  },
  Winter: {
    bgStart: '#0f1f3d',     // Deep navy blue
    bgMid: '#1a2f52',       // Medium blue
    bgEnd: '#2d4a7a',       // Steel blue
    accentPrimary: '#60a5fa', // Light blue
    accentSecondary: '#93c5fd', // Sky blue
    glassBase: 'rgba(96, 165, 250, 0.12)', // Blue tint
  },
};

// Biome-based themes (override seasons except for Temperate)
const BIOME_THEMES: Record<BiomeType, ThemeColors | null> = {
  Temperate: null, // Use season-based theme
  Mediterranean: {
    bgStart: '#1a2f3d',     // Deep cyan-blue
    bgMid: '#2d4a5f',       // Ocean blue
    bgEnd: '#4f6b7a',       // Light teal
    accentPrimary: '#38bdf8', // Sky blue
    accentSecondary: '#fbbf24', // Sun yellow
    glassBase: 'rgba(56, 189, 248, 0.08)', // Blue tint
  },
  Desert: {
    bgStart: '#3d2810',     // Deep sand
    bgMid: '#5f4a2d',       // Desert tan
    bgEnd: '#7a6b4f',       // Light sand
    accentPrimary: '#fbbf24', // Gold
    accentSecondary: '#fb923c', // Orange
    glassBase: 'rgba(251, 191, 36, 0.08)', // Gold tint
  },
  Polar: {
    bgStart: '#0f1f3d',     // Deep ice blue
    bgMid: '#1a2f4a',       // Glacial blue
    bgEnd: '#2d4a6b',       // Ice blue
    accentPrimary: '#93c5fd', // Ice blue
    accentSecondary: '#e0f2fe', // Snow white-blue
    glassBase: 'rgba(147, 197, 253, 0.08)', // Blue tint
  },
  Rainforest: {
    bgStart: '#0f2d1a',     // Deep jungle green
    bgMid: '#1a4a2d',       // Rainforest green
    bgEnd: '#2d6b3d',       // Bright jungle
    accentPrimary: '#22c55e', // Vibrant green
    accentSecondary: '#84cc16', // Lime green
    glassBase: 'rgba(34, 197, 94, 0.08)', // Green tint
  },
  Underdark: {
    bgStart: '#1a0f2d',     // Deep purple-black
    bgMid: '#2d1a3d',       // Dark purple
    bgEnd: '#3d2d4a',       // Mystic purple
    accentPrimary: '#a78bfa', // Purple
    accentSecondary: '#c084fc', // Light purple
    glassBase: 'rgba(167, 139, 250, 0.08)', // Purple tint
  },
};

/**
 * Get the theme colors based on biome and season
 * If biome is Temperate, use season-based theme
 * Otherwise, use biome-specific theme
 */
export function getThemeColors(biome: BiomeType, season: SeasonName): ThemeColors {
  const biomeTheme = BIOME_THEMES[biome];

  // If biome is Temperate (null), use season-based theme
  if (biomeTheme === null) {
    return SEASON_THEMES[season];
  }

  return biomeTheme;
}

/**
 * Apply theme colors to the document as CSS custom properties
 */
export function applyTheme(colors: ThemeColors): void {
  const root = document.documentElement;

  root.style.setProperty('--theme-bg-start', colors.bgStart);
  root.style.setProperty('--theme-bg-mid', colors.bgMid);
  root.style.setProperty('--theme-bg-end', colors.bgEnd);
  root.style.setProperty('--theme-accent-primary', colors.accentPrimary);
  root.style.setProperty('--theme-accent-secondary', colors.accentSecondary);
  root.style.setProperty('--theme-glass-base', colors.glassBase);
}
