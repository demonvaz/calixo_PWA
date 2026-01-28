/**
 * Avatar Energy Management
 * 
 * Energy levels determine the avatar's appearance and state
 * Energy is affected by completing challenges and maintaining streaks
 */

export type EnergyLevel = 'alta' | 'media' | 'baja';

export interface EnergyThresholds {
  alta: number;  // >= 70
  media: number; // >= 40
  baja: number;  // < 40
}

export const ENERGY_THRESHOLDS: EnergyThresholds = {
  alta: 70,
  media: 40,
  baja: 0,
};

/**
 * Calculate energy level from energy value
 */
export function getEnergyLevel(energy: number): EnergyLevel {
  if (energy >= ENERGY_THRESHOLDS.alta) {
    return 'alta';
  } else if (energy >= ENERGY_THRESHOLDS.media) {
    return 'media';
  } else {
    return 'baja';
  }
}

/**
 * Calculate energy change based on challenge completion
 */
export function calculateEnergyGain(challengeType: 'daily' | 'focus' | 'social'): number {
  const energyGains = {
    daily: 5,
    focus: 10,
    social: 8,
  };
  
  return energyGains[challengeType];
}

/**
 * Calculate energy decay for inactivity
 * Returns the amount to decrease per day of inactivity
 */
export function calculateEnergyDecay(daysInactive: number): number {
  if (daysInactive === 0) return 0;
  
  // -2 energy per day of inactivity
  return Math.min(daysInactive * 2, 50); // Max 50 energy loss
}

/**
 * Clamp energy value between 0 and 100
 */
export function clampEnergy(energy: number): number {
  return Math.max(0, Math.min(100, energy));
}

/**
 * Get color for energy level
 */
export function getEnergyColor(energyLevel: EnergyLevel): string {
  const colors = {
    alta: '#22C55E',  // green
    media: '#EAB308', // yellow
    baja: '#EF4444',  // red
  };
  
  return colors[energyLevel];
}

/**
 * Get emoji for energy level
 */
export function getEnergyEmoji(energyLevel: EnergyLevel): string {
  return '';
}

/**
 * Get message for energy level
 */
export function getEnergyMessage(energyLevel: EnergyLevel): string {
  const messages = {
    alta: '¡Tu CALI está lleno de energía! Sigue así.',
    media: 'Tu CALI necesita más descanso digital.',
    baja: 'Tu CALI está cansado. ¡Completa algunos retos!',
  };
  
  return messages[energyLevel];
}

/**
 * Update avatar energy based on challenge completion
 */
export function updateEnergyOnChallengeComplete(
  currentEnergy: number,
  challengeType: 'daily' | 'focus' | 'social'
): number {
  const gain = calculateEnergyGain(challengeType);
  return clampEnergy(currentEnergy + gain);
}

/**
 * Update avatar energy based on inactivity
 */
export function updateEnergyOnInactivity(
  currentEnergy: number,
  daysInactive: number
): number {
  const decay = calculateEnergyDecay(daysInactive);
  return clampEnergy(currentEnergy - decay);
}






