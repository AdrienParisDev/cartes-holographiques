import { createHolographicTreatment } from './holographic-treatment.js';
import { textureCatalog } from './textures/texture-catalog.js';

export function createTexture(type, style, options = {}) {
  const definition = textureCatalog[type];
  if (!definition) throw new Error(`Texture inconnue : ${type}`);

  const animated = options.animated ?? definition.animatedByDefault;
  return {
    id: crypto.randomUUID(),
    type,
    geometry: { spacing: style.gridSize, angle: style.angle },
    holographicTreatment: options.holographic
      ? createHolographicTreatment(style, 'texture', definition.treatmentDefaults || {})
      : null,
    digitalAnimation: {
      enabled: Boolean(animated),
      mode: animated ? 'shimmer' : 'none',
      speed: 1
    },
    propagateDown: Boolean(options.propagateDown)
  };
}

export function getPropagatedTextureSources(layer, layers) {
  const targetIndex = layers.findIndex((entry) => entry.id === layer.id);
  if (targetIndex < 0) return [];
  return layers.slice(targetIndex + 1).flatMap((source) => (
    source.textures
      .filter((texture) => texture.propagateDown)
      .map((texture) => ({
        ...texture,
        inheritedFrom: source.id,
        inheritedFromName: source.name
      }))
  ));
}

export function findOwnTexture(layer, type) {
  return layer.textures.find((texture) => texture.type === type);
}

export function getEffectiveTextures(layer, layers) {
  const targetIndex = layers.findIndex((entry) => entry.id === layer.id);
  const textures = layer.textures.map((texture) => ({
    ...texture,
    inheritedFrom: null
  }));

  layers.slice(targetIndex + 1).forEach((source) => {
    source.textures
      .filter((texture) => texture.propagateDown)
      .forEach((texture) => {
        if (!textures.some((entry) => entry.type === texture.type)) {
          textures.push({
            ...texture,
            inheritedFrom: source.id,
            inheritedFromName: source.name
          });
        }
      });
  });

  return textures;
}
