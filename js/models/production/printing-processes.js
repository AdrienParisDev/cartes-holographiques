export const printingProcessCatalog = {
  'digital-cmyk': {
    label: 'Impression numérique CMJN',
    compatibleSubstrates: ['coated-paper'],
    capabilities: ['print']
  },
  'uv-digital': {
    label: 'Impression UV',
    compatibleSubstrates: ['coated-paper', 'holographic-film', 'metal', 'transparent-plastic'],
    capabilities: ['print', 'uv-print', 'white-underbase']
  },
  screenprint: {
    label: 'Sérigraphie',
    compatibleSubstrates: ['coated-paper', 'holographic-film', 'metal', 'transparent-plastic'],
    capabilities: ['print', 'white-underbase', 'special-ink']
  }
};
