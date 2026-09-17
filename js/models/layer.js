import { createDefaultLayerStyle } from '../config/holography.js';
import { createTexture } from './texture.js';

export function createLayer(name, src, treatment = {}, style = {}) {
  const layerStyle = createDefaultLayerStyle(style);
  return {
    id: crypto.randomUUID(),
    name,
    src,
    visible: true,
    previewVisibility: { support: true, hiddenTextureIds: [] },
    clipSupport: true,
    clipTextures: true,
    supportInteraction: { mode: treatment.reflection ? 'reveal' : 'opaque', intensity: 100, propagateDown: false },
    textures: (treatment.patterns || []).map((type) => createTexture(
      type,
      layerStyle,
      { holographic: true }
    )),
    style: layerStyle
  };
}

export function createExampleLayers() {
  return [
    createLayer('Ciel', 'assets/paris-master-layers/04-sky-background.png', {}, { palette: 'solar', foilIntensity: 30 }),
    createLayer('Tour Eiffel', 'assets/paris-master-layers/03-eiffel-distance.png', { reflection: true }, { material: 'etched-metal', palette: 'solar', foilIntensity: 52, blendMode: 'screen' }),
    createLayer('Ville', 'assets/paris-master-layers/02-middle-city.png', { patterns: ['crosshatch'] }, { palette: 'ice', foilIntensity: 45, gridSize: 10, angle: 55 }),
    createLayer('Personnage & toit', 'assets/paris-master-layers/01-foreground-person-roof.png', { patterns: ['sparkle'] }, { palette: 'aurora', glitterIntensity: 40 })
  ];
}
