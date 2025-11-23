import type { SeasonName, BiomeType } from '../types';

interface WeatherOption {
  condition: string;
  weight: number;
  tempModifier: number;
}

// 1. Define Tables for Every Biome/Season combo
const BIOME_TABLES: Record<BiomeType, Record<SeasonName, WeatherOption[]>> = {
  
  // --- TEMPERATE ---
  Temperate: {
    Spring: [
      { condition: 'Clear', weight: 30, tempModifier: 5 },
      { condition: 'Partly Cloudy', weight: 30, tempModifier: 0 },
      { condition: 'Light Rain', weight: 20, tempModifier: -5 },
      { condition: 'Heavy Rain', weight: 10, tempModifier: -10 },
      { condition: 'Foggy', weight: 10, tempModifier: -5 },
    ],
    Summer: [
      { condition: 'Clear', weight: 40, tempModifier: 10 },
      { condition: 'Scorching', weight: 10, tempModifier: 20 },
      { condition: 'Partly Cloudy', weight: 20, tempModifier: 0 },
      { condition: 'Thunderstorm', weight: 15, tempModifier: -5 },
      { condition: 'Drizzle', weight: 15, tempModifier: -5 },
    ],
    Fall: [
      { condition: 'Clear', weight: 20, tempModifier: 0 },
      { condition: 'Windy', weight: 25, tempModifier: -5 },
      { condition: 'Overcast', weight: 25, tempModifier: -5 },
      { condition: 'Rain', weight: 20, tempModifier: -10 },
      { condition: 'Early Snow', weight: 5, tempModifier: -20 },
    ],
    Winter: [
      { condition: 'Clear', weight: 20, tempModifier: -5 },
      { condition: 'Overcast', weight: 30, tempModifier: 0 },
      { condition: 'Light Snow', weight: 25, tempModifier: -5 },
      { condition: 'Blizzard', weight: 15, tempModifier: -15 },
      { condition: 'Sleet', weight: 10, tempModifier: -5 },
    ]
  },

  // --- DESERT ---
  Desert: {
    Spring: [
      { condition: 'Clear', weight: 60, tempModifier: 10 },
      { condition: 'Windy', weight: 30, tempModifier: 5 },
      { condition: 'Sandstorm', weight: 10, tempModifier: 15 },
    ],
    Summer: [
      { condition: 'Scorching', weight: 50, tempModifier: 30 },
      { condition: 'Clear', weight: 40, tempModifier: 20 },
      { condition: 'Heat Wave', weight: 10, tempModifier: 40 },
    ],
    Fall: [
      { condition: 'Clear', weight: 70, tempModifier: 5 },
      { condition: 'Windy', weight: 20, tempModifier: 0 },
      { condition: 'Light Rain', weight: 10, tempModifier: -10 },
    ],
    Winter: [
      { condition: 'Clear', weight: 50, tempModifier: -10 }, // Cold desert nights
      { condition: 'Cold Winds', weight: 30, tempModifier: -15 },
      { condition: 'Overcast', weight: 20, tempModifier: -5 },
    ]
  },

  // --- POLAR ---
  Polar: {
    Spring: [
      { condition: 'Overcast', weight: 40, tempModifier: 0 },
      { condition: 'Light Snow', weight: 40, tempModifier: -5 },
      { condition: 'Clear', weight: 20, tempModifier: -10 },
    ],
    Summer: [
      { condition: 'Clear', weight: 30, tempModifier: 10 },
      { condition: 'Overcast', weight: 40, tempModifier: 5 },
      { condition: 'Sleet', weight: 30, tempModifier: 0 },
    ],
    Fall: [
      { condition: 'Snow', weight: 40, tempModifier: -5 },
      { condition: 'Freezing Fog', weight: 30, tempModifier: -10 },
      { condition: 'Blizzard', weight: 30, tempModifier: -15 },
    ],
    Winter: [
      { condition: 'Extreme Cold', weight: 40, tempModifier: -30 },
      { condition: 'Blizzard', weight: 30, tempModifier: -20 },
      { condition: 'Whiteout', weight: 30, tempModifier: -25 },
    ]
  },

  // --- RAINFOREST ---
  Rainforest: {
    Spring: [
      { condition: 'Humid', weight: 30, tempModifier: 5 },
      { condition: 'Light Rain', weight: 40, tempModifier: 0 },
      { condition: 'Monsoon', weight: 30, tempModifier: -5 },
    ],
    Summer: [
      { condition: 'Steamy Mist', weight: 30, tempModifier: 10 },
      { condition: 'Thunderstorm', weight: 40, tempModifier: 5 },
      { condition: 'Heavy Rain', weight: 30, tempModifier: 0 },
    ],
    Fall: [
      { condition: 'Overcast', weight: 30, tempModifier: 5 },
      { condition: 'Rain', weight: 50, tempModifier: 0 },
      { condition: 'Windy', weight: 20, tempModifier: -5 },
    ],
    Winter: [
      { condition: 'Mist', weight: 40, tempModifier: 0 },
      { condition: 'Light Rain', weight: 30, tempModifier: -5 },
      { condition: 'Clear', weight: 30, tempModifier: 5 },
    ]
  },

  // --- MEDITERRANEAN ---
  Mediterranean: {
    Spring: [
      { condition: 'Clear', weight: 40, tempModifier: 5 },
      { condition: 'Sea Breeze', weight: 30, tempModifier: 0 },
      { condition: 'Light Rain', weight: 20, tempModifier: -5 },
      { condition: 'Coastal Fog', weight: 10, tempModifier: -5 },
    ],
    Summer: [
      { condition: 'Clear', weight: 50, tempModifier: 10 },
      { condition: 'Scorching Sun', weight: 30, tempModifier: 15 },
      { condition: 'Dry Heat', weight: 15, tempModifier: 10 },
      { condition: 'Sea Breeze', weight: 5, tempModifier: 0 },
    ],
    Fall: [
      { condition: 'Partly Cloudy', weight: 30, tempModifier: 0 },
      { condition: 'Windy', weight: 30, tempModifier: -5 },
      { condition: 'Rain', weight: 30, tempModifier: -10 },
      { condition: 'Thunderstorm', weight: 10, tempModifier: -5 },
    ],
    Winter: [
      { condition: 'Heavy Rain', weight: 40, tempModifier: -5 },
      { condition: 'Coastal Storm', weight: 30, tempModifier: -10 },
      { condition: 'Overcast', weight: 20, tempModifier: 0 },
      { condition: 'Clear', weight: 10, tempModifier: 5 },
    ]
  },

  // --- UNDERDARK ---
  Underdark: {
    Spring: [{ condition: 'Stale Air', weight: 100, tempModifier: 0 }],
    Summer: [{ condition: 'Warm Drafts', weight: 100, tempModifier: 5 }],
    Fall: [{ condition: 'Spore Clouds', weight: 100, tempModifier: 0 }],
    Winter: [{ condition: 'Cold Drafts', weight: 100, tempModifier: -5 }],
  }
};

// Base Temps per Biome + Season
const BASE_TEMPS: Record<BiomeType, Record<SeasonName, number>> = {
  Temperate: { Spring: 60, Summer: 85, Fall: 55, Winter: 30 },
  Desert:    { Spring: 80, Summer: 105, Fall: 75, Winter: 50 },
  Polar:     { Spring: 10, Summer: 35, Fall: 0, Winter: -30 },
  Rainforest:{ Spring: 80, Summer: 90, Fall: 85, Winter: 75 },
  Mediterranean: { Spring: 65, Summer: 85, Fall: 70, Winter: 50 },
  Underdark: { Spring: 55, Summer: 55, Fall: 55, Winter: 55 },
};

export const generateWeather = (season: SeasonName, biome: BiomeType) => {
  // Safety check to prevent crashing if biome is invalid
  const validBiome = BIOME_TABLES[biome] ? biome : 'Temperate';
  
  // Safety check for season
  const options = BIOME_TABLES[validBiome][season] || BIOME_TABLES['Temperate']['Spring'];
  const baseTemp = BASE_TEMPS[validBiome][season];

  // 1. Total Weight
  const totalWeight = options.reduce((acc, opt) => acc + opt.weight, 0);
  
  // 2. Roll
  let random = Math.random() * totalWeight;
  let selected = options[0];

  for (const option of options) {
    if (random < option.weight) {
      selected = option;
      break;
    }
    random -= option.weight;
  }

  // 3. Temp Variance
  const variance = Math.floor(Math.random() * 10) - 5; 
  let temp = baseTemp + selected.tempModifier + variance;

  return {
    currentCondition: selected.condition,
    temperature: temp
  };
};