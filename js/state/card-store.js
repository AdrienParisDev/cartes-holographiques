import { createDefaultProductionProfile } from '../models/production/default-production.js';
import { createExampleLayers } from '../models/layer.js?v=effect-preview-2';

export function createCardStore() {
  let layers = createExampleLayers();
  let selectedLayerId = layers.at(-1).id;
  const production = createDefaultProductionProfile();

  return {
    get layers() { return layers; },
    get production() { return production; },
    get selectedLayerId() { return selectedLayerId; },
    get selectedLayer() {
      return layers.find((layer) => layer.id === selectedLayerId);
    },
    selectLayer(id) { selectedLayerId = id; },
    replaceLayers(nextLayers) { layers = nextLayers; },
    addLayer(layer) { layers.push(layer); selectedLayerId = layer.id; },
    moveSelected(direction) {
      const index = layers.findIndex((layer) => layer.id === selectedLayerId);
      const target = index + direction;
      if (target < 0 || target >= layers.length) return;
      [layers[index], layers[target]] = [layers[target], layers[index]];
    },
    reorder(layerIds) {
      const byId = new Map(layers.map((layer) => [layer.id, layer]));
      layers = layerIds.map((id) => byId.get(id)).filter(Boolean);
    },
    deleteLayer(id) {
      if (layers.length === 1) return false;
      const index = layers.findIndex((layer) => layer.id === id);
      if (index < 0) return false;
      layers.splice(index, 1);
      selectedLayerId = layers[Math.min(index, layers.length - 1)].id;
      return true;
    },
    reset() {
      layers = createExampleLayers();
      selectedLayerId = layers.at(-1).id;
    }
  };
}
