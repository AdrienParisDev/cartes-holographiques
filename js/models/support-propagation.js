export function getPropagatedSupportSources(layer, layers) {
  const targetIndex = layers.findIndex((entry) => entry.id === layer.id);
  if (targetIndex < 0) return [];
  return layers.slice(targetIndex + 1).filter((source) => (
    source.supportInteraction?.mode === 'reveal' && source.supportInteraction?.propagateDown
  ));
}

export function getEffectiveSupportInteraction(layer, index, layers) {
  if (layer.supportInteraction?.mode === 'reveal') {
    return { ...layer.supportInteraction, inheritedFrom: null };
  }
  const source = getPropagatedSupportSources(layer, layers)[0];
  return source
    ? { ...source.supportInteraction, inheritedFrom: source.id, inheritedFromName: source.name }
    : layer.supportInteraction;
}
