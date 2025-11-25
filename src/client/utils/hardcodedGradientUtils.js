// Gradient presets for cycle cards
export const GRADIENT_PRESETS = [
    { start: '#71883E', end: '#8c794c' }, // 1
    { start: '#87bbd9', end: '#cf91b3' }, 
    { start: '#454708', end: '#101302' }, 
    { start: '#7c8b92', end: '#215d2e' }, 
    { start: '#5D8575', end: '#899A93' }, // 5
    { start: '#5D6668', end: '#1F1C17' }, 
    { start: '#BE2F3C', end: '#171813' }, 
    { start: '#DB4C4B', end: '#181715' }, 
    { start: '#B9E9EC', end: '#214258' }, 
    { start: '#961158', end: '#5957AE' }, // 10
    { start: '#3FB4C0', end: '#BE67DE' }, 
    { start: '#F8E8C6', end: '#D6872B' }, 
    { start: '#9A3727', end: '#AC583C' }, 
    { start: '#DA41F7', end: '#CEC6FB' }, 
    { start: '#000000', end: '#5B8896' }, // 15
    { start: '#97A09F', end: '#21201D' }, 
    { start: '#E3D7BF', end: '#C59D6B' }, 
    { start: '#B0BCC0', end: '#131313' }, 
    { start: '#BD94EC', end: '#6D5B82' }, 
    { start: '#0B0B15', end: '#CEC7B2' }, // 20
    { start: '#BD94EC', end: '#6D5B82' }, 
    { start: '#C0AF7C', end: '#604724' }, 
    { start: '#320401', end: '#3F0F50' }, 
    { start: '#DED5CD', end: '#D1966E' }, 
    { start: '#EAE7E2', end: '#C5876B' }, // 25
    { start: '#2A0B09', end: '#B6673C' }, 
    { start: '#091113', end: '#D6D9D8' }, 
    { start: '#41495C', end: '#F89CB5' }, 
    { start: '#1D171F', end: '#04A3E7' }, 
    { start: '#81807E', end: '#40403E' }, // 30
    { start: '#000000', end: '#008C5A' }, 
    { start: '#000000', end: '#5B8896' }, 
    { start: '#D6DCD8', end: '#7B7A75' }, 
    { start: '#105B6B', end: '#85C163' }, 
    { start: '#78B2D3', end: '#242425' }, // 35
    { start: '#941C28', end: '#3E3F53' }, 
    { start: '#9D0F12', end: '#120201' }, 
    { start: '#5F6E6B', end: '#0B0B0B' }, 
    { start: '#EC6F43', end: '#794C49' }, 
    { start: '#000000', end: '#610348' }, // 40
    { start: '#C7CED3', end: '#215D80' }, 
    { start: '#AD8D54', end: '#E6CEAC' }, 
    { start: '#F6F2EE', end: '#506CB0' }, 
    { start: '#DABF88', end: '#D66B3F' }, 
    { start: '#C6AD90', end: '#3A2F2C' }, // 45
    { start: '#433931', end: '#AF6E49' }, 
    { start: '#e8e8e8', end: '#F0CC7C' }, 
    { start: '#E03E38', end: '#FCE51D' }, 
    { start: '#79617F', end: '#362549' }, 
    { start: '#573636', end: '#F1E8C1' }, // 50
    { start: '#CBB0B0', end: '#1B2838' }, 
    { start: '#618C6A', end: '#AEA299' }, 
    { start: '#E7E7E5', end: '#1D2025' }, 
    { start: '#0A131C', end: '#0D3756' }, 
    { start: '#0A131C', end: '#0D3756' }, // 55
    { start: '#008EF3', end: '#000000' }, 
    { start: '#10110E', end: '#FFFFFF' }, 
    { start: '#141615', end: '#838585' }, 
    { start: '#191816', end: '#688F43' }, 
    { start: '#E6D5C7', end: '#A18392' }, // 60
    { start: '#6F2A27', end: '#1F5573' }, 
    { start: '#0A0A12', end: '#B4CCF7' }, 
    { start: '#E6E0CA', end: '#77431D' }, 
    { start: '#3F50CC', end: '#081587' }, 
    { start: '#E7E7E5', end: '#1D2025' }, // 65
    { start: '#226FB2', end: '#000E21' }, 
    { start: '#9F5E27', end: '#9F0918' }, 
    { start: '#79431D', end: '#D2D9D8' }, 
    { start: '#F8F7D3', end: '#F68A33' }, 
    { start: '#0A0C0B', end: '#A6B0B7' }, // 70
    { start: '#E6E0CA', end: '#77431D' },
    { start: '#1A0D0B', end: '#770613' },
    { start: '#0D0721', end: '#C7C2CA' },
    { start: '#E7E7E5', end: '#1D2025' }, 
    { start: '#C21C0C', end: '#070E0E' }, // 75
    { start: '#41B736', end: '#011806' },
    { start: '#CCA882', end: '#C9352F' },
    { start: '#E7E7E5', end: '#1D2025' },
    { start: '#40CA4A', end: '#66EBE3' },
    { start: '#69A2A8', end: '#8E3A34' }, // 80
    { start: '#8A8A8A', end: '#2A2A2A' },
    { start: '#E2AA95', end: '#0C0105' },
    { start: '#3A80E2', end: '#7ED3DE' },
    { start: '#485233', end: '#1B1E12' },
];

/**
 * Gets a gradient preset by index
 * @param {number} index - The index of the gradient preset
 * @returns {object} Object with start and end color properties
 */
export const getGradientPreset = (index) => {
  return GRADIENT_PRESETS[index % GRADIENT_PRESETS.length];
};

/**
 * Creates a CSS gradient string from a preset
 * @param {object} preset - Object with start and end color properties
 * @param {number} angle - Gradient angle in degrees (default: 135)
 * @returns {string} CSS linear gradient string
 */
export const createGradientString = (preset, angle = 135) => {
  return `linear-gradient(${angle}deg, ${preset.start} 0%, ${preset.end} 100%)`;
};

/**
 * Applies a gradient preset to an element
 * @param {HTMLElement} element - The DOM element to apply the gradient to
 * @param {number} index - The index of the gradient preset to use
 */
export const applyGradientPreset = (element, index) => {
  const preset = getGradientPreset(index);
  const gradientString = createGradientString(preset);
  element.style.background = gradientString;
};

/**
 * Applies unique gradient presets to a collection of elements
 * @param {NodeList|Array} elements - Collection of DOM elements
 * @param {number} startIndex - Starting index for gradient selection (default: 0)
 */
export const applyHardcodedGradientPresets = (elements, startIndex = 0) => {
  elements.forEach((element, index) => {
    applyGradientPreset(element, startIndex + index);
  });
};