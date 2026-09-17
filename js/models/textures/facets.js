export const facetsTexture = {
  type: 'facets',
  label: 'Facettes',
  className: 'holo-facets',
  effectClass: 'effect-facets',
  color: 'pink',
  productionRequirements: { substrates: ['holographic-film', 'metal'], fallbacks: { 'coated-paper': 'printed-facets', 'transparent-plastic': 'uv-printed-facets' } },
  animatedByDefault: false,
  treatmentDefaults: { response: 'multi-facet', facetContrast: 70, apparentDepth: 45, colorVariation: 75, highlightSharpness: 60, lightResponse: 100 },
};
