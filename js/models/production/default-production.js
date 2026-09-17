export function createDefaultProductionProfile() {
  return {
    profileVersion: 1,
    substrate: 'holographic-film',
    printingProcess: 'uv-digital',
    inkSystem: 'cmyk-white',
    finish: 'gloss-varnish',
    support: {
      material: 'diffraction',
      palette: 'prism',
      intensity: 60,
      blendMode: 'color-dodge',
      angle: 55,
      lightResponse: 100
    },
    manufacturerProfileId: null
  };
}
