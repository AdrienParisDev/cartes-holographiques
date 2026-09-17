export function createHolographicTreatment(style, target = 'texture', overrides = {}) {
  return {
    id: crypto.randomUUID(),
    target,
    material: style.material,
    palette: style.palette,
    intensity: style.foilIntensity,
    blendMode: style.blendMode,
    lightResponse: 'reactive',    ...overrides
  };
}
