// gradientUtils.js - Utility functions for generating random gradients

/**
 * Generates a random hex color
 * @returns {string} A hex color string like "#ff5733"
 */
function getRandomHexColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * Generates a random HSL color with controlled saturation and lightness
 * @param {number} minSaturation - Minimum saturation (0-100)
 * @param {number} maxSaturation - Maximum saturation (0-100)
 * @param {number} minLightness - Minimum lightness (0-100)
 * @param {number} maxLightness - Maximum lightness (0-100)
 * @returns {string} An HSL color string like "hsl(240, 80%, 60%)"
 */
function getRandomHSLColor(minSaturation = 50, maxSaturation = 90, minLightness = 40, maxLightness = 70) {
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * (maxSaturation - minSaturation + 1)) + minSaturation;
  const lightness = Math.floor(Math.random() * (maxLightness - minLightness + 1)) + minLightness;
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Predefined gradient color combinations that work well together
 */
const GRADIENT_PRESETS = [
    // Classic gradients
    ['#667eea', '#764ba2'], // Purple-blue
    ['#3b82f6', '#1d4ed8'], // Blue
    ['#10b981', '#047857'], // Green
    ['#f59e0b', '#d97706'], // Orange
    ['#ef4444', '#dc2626'], // Red
    ['#8b5cf6', '#7c3aed'], // Purple
    ['#06b6d4', '#0891b2'], // Cyan
    ['#ec4899', '#be185d'], // Pink
    ['#84cc16', '#65a30d'], // Lime
    ['#f97316', '#ea580c'], // Orange-red
    ['#6366f1', '#4f46e5'], // Indigo
    ['#14b8a6', '#0d9488'], // Teal
    ['#f472b6', '#ec4899'], // Light pink
    ['#a78bfa', '#8b5cf6'], // Lavender
    ['#e879f9', '#d946ef'], // Magenta
    ['#fcd34d', '#fbbf24'], // Yellow
    ['#d4d4d8', '#a1a1aa'], // Gray

    // // Lighter shades for softer gradients
    ['#a3e635', '#65a30d'], // Light green
    ['#fca5a5', '#f87171'], // Light red
    ['#c084fc', '#a855f7'],  // Light purple
    ['#f9a8d4', '#ec4899'], // Light pink
    ['#d4d4d8', '#a1a1aa'], // Light gray

    // // Darker shades for contrast
    ['#1e293b', '#334155'], // Dark blue-gray
    ['#111827', '#1f2937'], // Dark gray
    ['#0f172a', '#1e293b'], // Very dark blue-gray
    ['#0c4a6e', '#0e7490'], // Dark cyan
    ['#881337', '#b91c1c'], // Dark red
    ['#4b5563', '#6b7280'], // Dark gray-blue
    ['#374151', '#1f2937'], // Dark slate gray
    ['#111827', '#1f2937'],  // Almost black
    ['#1f2937', '#374151'], // Dark slate blue
    ['#0d9488', '#0f766e'], // Dark teal
    ['#4c1d95', '#6d28d9'], // Dark purple
    ['#831843', '#a21caf'], // Dark magenta
    ['#b91c1c', '#dc2626'], // Dark red-orange
    ['#f59e0b', '#d97706'], // Dark orange
    ['#f97316', '#ea580c'], // Dark orange-red
    ['#fbbf24', '#f59e0b'], // Dark yellow
    ['#a3e635', '#65a30d'], // Dark lime green
    ['#f472b6', '#ec4899'], // Dark pink
    ['#c084fc', '#a855f7'], // Dark lavender
    ['#e879f9', '#d946ef'], // Dark magenta
    ['#fcd34d', '#fbbf24'], // Dark light yellow
    ['#d4d4d8', '#a1a1aa'],  // Dark light gray

    // Additional unique gradients
    ['hsl(238, 55%, 45%)', 'hsl(222, 69%, 56%)'], // Blue-purple
    ['hsl(210, 100%, 50%)', 'hsl(180, 100%, 50%)'], // Blue-cyan
    ['hsl(330, 100%, 50%)', 'hsl(300, 100%, 50%)'], // Pink-purple
    ['hsl(240, 100%, 50%)', 'hsl(210, 100%, 50%)'], // Blue-indigo
    ['hsl(0, 100%, 50%)', 'hsl(30, 100%, 50%)'], // Red-orange
    ['hsl(300, 100%, 50%)', 'hsl(270, 100%, 50%)'], // Purple-pink
    ['hsl(218, 74%, 58%)', 'hsl(216, 51%, 51%)'], // Teal-blue
    ['hsl(266, 58%, 53%)', 'hsl(323, 50%, 45%)'], // Purple-pink
    ['hsl(76, 62%, 59%)', 'hsl(1, 56%, 62%)'], // Green-yellow
    ['hsl(319, 67%, 57%)', 'hsl(193, 80%, 46%)'], // Pink-cyan
    ['hsl(15, 69%, 68%)', 'hsl(301, 90%, 48%)'], // Orange-purple
    ['hsl(209, 68%, 42%)', 'hsl(225, 75%, 64%)'], // Blue-teal
    ['hsl(36, 65%, 68%)', 'hsl(332, 79%, 70%)'], // Yellow-pink
    ['hsl(0, 67%, 64%)', 'hsl(206, 56%, 42%)'], // Red-blue
    ['hsl(344, 73%, 61%)', 'hsl(341, 58%, 56%)'], // Pink-red
    ['hsl(25, 60%, 54%)', 'hsl(316, 67%, 56%)'], // Pink-red
    ['hsl(276, 89%, 61%)', 'hsl(180, 71%, 61%)'], // Purple-cyan
    ['hsl(252, 71%, 49%)', 'hsl(152, 56%, 64%)'], // Purple-green
    ['hsl(237, 51%, 44%)', 'hsl(183, 66%, 65%)'], // Blue-teal
];

/**
 * Generates a random gradient from predefined presets
 * @returns {object} Object with startColor and endColor properties
 */
function getRandomPresetGradient() {
  const preset = GRADIENT_PRESETS[Math.floor(Math.random() * GRADIENT_PRESETS.length)];
  return {
    startColor: preset[0],
    endColor: preset[1]
  };
}

/**
 * Generates a random gradient with harmonious colors
 * @returns {object} Object with startColor and endColor properties
 */
function getRandomHarmoniousGradient() {
  const baseHue = Math.floor(Math.random() * 360);
  const hueVariation = Math.floor(Math.random() * 60) + 20; // 20-80 degree variation
  
  const startColor = `hsl(${baseHue}, ${Math.floor(Math.random() * 40) + 60}%, ${Math.floor(Math.random() * 20) + 50}%)`;
  const endColor = `hsl(${(baseHue + hueVariation) % 360}, ${Math.floor(Math.random() * 40) + 60}%, ${Math.floor(Math.random() * 20) + 40}%)`;
  
  return {
    startColor,
    endColor
  };
}

/**
 * Applies a random gradient to a cycle card element
 * @param {HTMLElement} cardElement - The cycle card DOM element
 * @param {string} method - The method to use: 'preset', 'harmonious', or 'random'
 */
function applyRandomGradient(cardElement, method = 'preset') {
  let gradient;
  
  switch (method) {
    case 'harmonious':
      gradient = getRandomHarmoniousGradient();
      break;
    case 'random':
      gradient = {
        startColor: getRandomHSLColor(),
        endColor: getRandomHSLColor()
      };
      break;
    case 'preset':
    default:
      gradient = getRandomPresetGradient();
      break;
  }
  
  // Set CSS custom properties
  cardElement.style.setProperty('--gradient-start', gradient.startColor);
  cardElement.style.setProperty('--gradient-end', gradient.endColor);
}

/**
 * Applies random gradients to all cycle cards in the container
 * @param {string} containerSelector - CSS selector for the container (default: '.cycles-grid')
 * @param {string} cardSelector - CSS selector for cycle cards (default: '.cycle-card')
 * @param {string} method - The method to use: 'preset', 'harmonious', or 'random'
 */
function applyRandomGradientToAll(containerSelector = '.cycles-grid', cardSelector = '.cycle-card', method = 'preset') {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  const cards = container.querySelectorAll(cardSelector);
  cards.forEach(card => {
    applyRandomGradient(card, method);
  });
}

/**
 * Initialize random gradients when the DOM is ready
 * Call this function after your cycle cards are rendered
 */
function initializeRandomGradients() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyRandomGradientToAll();
    });
  } else {
    applyRandomGradientToAll();
  }
}

/**
 * Applies unique preset gradients to a list of DOM elements (cycle cards).
 * Falls back to random gradients if not enough unique presets are available.
 * @param {NodeList} cardElements - List of card elements (DOM nodes)
 * @param {string} fallbackMethod - 'harmonious' | 'random' | 'preset' (default: 'preset')
 */
function applyUniquePresetGradients(cardElements, fallbackMethod = 'random') {
  if (!cardElements || cardElements.length === 0) return;

  const shuffledPresets = [...GRADIENT_PRESETS].sort(() => Math.random() - 0.5);
  // const shuffledPresets = GRADIENT_PRESETS;
  const usedCount = Math.min(cardElements.length, shuffledPresets.length);

  for (let i = 0; i < usedCount; i++) {
    const card = cardElements[i];
    const [startColor, endColor] = shuffledPresets[i];
    card.style.setProperty('--gradient-start', startColor);
    card.style.setProperty('--gradient-end', endColor);
  }

  // Apply fallback gradient method to remaining cards
  for (let i = usedCount; i < cardElements.length; i++) {
    applyRandomGradient(cardElements[i], fallbackMethod);
  }
}

// Export functions for use in other modules
export {
  getRandomHexColor,
  getRandomHSLColor,
  getRandomPresetGradient,
  getRandomHarmoniousGradient,
  applyRandomGradient,
  applyRandomGradientToAll,
  initializeRandomGradients,
  applyUniquePresetGradients
};