export const materialCatalog = {
  diffraction: {
    label: 'Diffraction croisée',
    className: 'material-diffraction'
  },
  galaxy: {
    label: 'Galaxie',
    className: 'material-galaxy'
  },
  spectrum: {
    label: 'Spectre intégral',
    className: 'material-spectrum'
  },
  'etched-metal': {
    label: 'Métal gravé',
    className: 'material-etched-metal'
  }
};

export function getMaterial(id) {
  return materialCatalog[id] || materialCatalog.diffraction;
}

export function materialOptionsMarkup() {
  return Object.entries(materialCatalog)
    .map(([value, material]) => `<option value="${value}">${material.label}</option>`)
    .join('');
}
