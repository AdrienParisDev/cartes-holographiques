export const palettes = {
  prism: ['#ff3e91', '#ffdb67', '#5affe0', '#5aa2ff', '#cb6dff', '#ff3e91'],
  aurora: ['#25f4c7', '#55a7ff', '#b05cff', '#ff66bf', '#25f4c7'],
  solar: ['#ff4f70', '#ff9d3d', '#ffe173', '#ff64bb', '#ff4f70'],
  ice: ['#e8fbff', '#7ee8ff', '#7897ff', '#d2b4ff', '#e8fbff']
};

export const interactionDefaults = {
  glareOpacity: 48,
  glareBrightness: 100,
  glareSpread: 36,
  glareConcentration: 55,
  glareBlendMode: 'soft-light',
  haloIntensity: 55,
  haloExtent: 100,
  rotationX: 14,
  rotationY: 18,
  perspective: 800
};

export const createDefaultLayerStyle = (overrides = {}) => ({
  material: 'diffraction',
  palette: 'prism',
  foilIntensity: 54,
  gridSize: 12,
  glitterIntensity: 23,
  blendMode: 'color-dodge',
  angle: 55,
  ...overrides
});
