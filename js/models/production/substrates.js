export const substrateCatalog = {
  'coated-paper': {
    label: 'Papier couché verni',
    capabilities: ['print', 'varnish', 'printed-texture'],
    appearance: { reflectivity: 0.22, roughness: 0.32, tint: '#f8f7f3' }
  },
  'holographic-film': {
    label: 'Film holographique',
    capabilities: ['print', 'white-underbase', 'diffractive', 'foil', 'varnish'],
    appearance: { reflectivity: 0.9, roughness: 0.08, tint: '#dff8ff' }
  },
  metal: {
    label: 'Métal',
    capabilities: ['uv-print', 'white-underbase', 'engraving', 'embossing'],
    appearance: { reflectivity: 0.72, roughness: 0.16, tint: '#cbd0d8' }
  },
  'transparent-plastic': {
    label: 'Plastique transparent',
    capabilities: ['uv-print', 'white-underbase', 'transparent-ink', 'varnish'],
    appearance: { reflectivity: 0.38, roughness: 0.1, tint: '#e9fbff' }
  }
};
