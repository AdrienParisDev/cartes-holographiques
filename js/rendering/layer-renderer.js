import { getPropagatedTextureSources } from '../models/texture.js';
import { textureCatalog } from '../models/textures/texture-catalog.js';
import { escapeHtml, maskUrl } from '../utils/dom.js';
import { createMaterialBackground, materialClassName } from './material-renderer.js';
import { getPropagatedSupportSources } from '../models/support-propagation.js';

function textureMarkup(texture) {
  const definition = textureCatalog[texture.type];
  if (!definition) return '';

  const spacing = texture.geometry.spacing;
  const treatment = texture.holographicTreatment;
  const materialClass = treatment ? materialClassName(treatment) : 'material-matte';
  const materialBackground = createMaterialBackground(treatment, texture.geometry.angle);
  const animation = texture.digitalAnimation;
  const animationMode = animation.enabled ? animation.mode : 'none';
  const animationDuration = Math.max(0.6, 4 / Math.max(0.25, animation.speed || 1));
  const treatmentIntensity = (treatment?.intensity ?? 35) / 100;
  const responseClass = treatment?.response ? ` response-${treatment.response}` : '';
  const responseValues = {
    colorShift: 80,
    highlightSharpness: 65,
    lightResponse: 100,
    dispersion: 70,
    highlightWidth: 50,
    directionContrast: 60,
    faceAlternation: 75,
    edgeHighlight: 55,
    directionality: 90,
    facetContrast: 70,
    apparentDepth: 45,
    colorVariation: 75
  };
  const responseVariables = Object.entries(responseValues)
    .map(([property, fallback]) => `--response-${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${(treatment?.[property] ?? fallback) / 100}`)
    .join(';');

  return `<div class="art-layer-effect ${definition.className} ${materialClass}${treatment ? ' texture-holographic' : ' texture-matte'}${responseClass}${animation.enabled ? ` texture-animated animation-${animationMode}` : ''}" style="--layer-grid-size:${spacing}px;--layer-grid-gap:${spacing * 0.55}px;--layer-grid-line:${spacing * 0.62}px;--layer-grid-end:${spacing * 0.78}px;--layer-angle:${texture.geometry.angle}deg;--texture-treatment-intensity:${treatmentIntensity};${responseVariables};--material-background:${materialBackground};mix-blend-mode:${treatment?.blendMode || 'screen'};--texture-animation-duration:${animationDuration}s"></div>`;
}

export function buildLayerElement(layer, index, layers, production = null) {
  const hiddenTextureIds = new Set(layer.previewVisibility?.hiddenTextureIds || []);
  const textures = layer.textures
    .filter((texture) => !hiddenTextureIds.has(texture.id))
    .map((texture) => ({ ...texture, inheritedFrom: null }));
  getPropagatedTextureSources(layer, layers).forEach((texture) => {
    if (!textures.some((entry) => entry.type === texture.type)) textures.push(texture);
  });
  const textureClasses = textures
    .map((texture) => textureCatalog[texture.type]?.effectClass)
    .filter(Boolean);
  const element = document.createElement('div');
  const localSupportVisible = layer.previewVisibility?.support !== false;
  const localSupport = layer.supportInteraction?.mode === 'reveal' && localSupportVisible
    ? { ...layer.supportInteraction, inheritedFrom: null }
    : null;
  const inheritedSupportSource = getPropagatedSupportSources(layer, layers)[0];
  const effectiveSupportInteraction = localSupport || (inheritedSupportSource
    ? { ...inheritedSupportSource.supportInteraction, inheritedFrom: inheritedSupportSource.id, inheritedFromName: inheritedSupportSource.name }
    : layer.supportInteraction);
  const revealsSupport = effectiveSupportInteraction ? effectiveSupportInteraction.mode === 'reveal' : Boolean(layer.imageTreatment);
  const supportTreatment = production?.support || layer.imageTreatment;
  const revealIntensity = (effectiveSupportInteraction?.intensity ?? 100) / 100;
  const clipSupport = layer.clipSupport ?? layer.clip ?? true;
  const clipTextures = layer.clipTextures ?? layer.clip ?? true;

  element.className = [
    'art-layer',
    clipSupport && 'clip-support',
    clipTextures && 'clip-textures',
    effectiveSupportInteraction?.inheritedFrom && 'support-inherited',
    revealsSupport && 'effect-foil',
    ...textureClasses
  ].filter(Boolean).join(' ');

  element.dataset.layerId = layer.id;
  element.hidden = !layer.visible;
  element.style.setProperty('--layer-mask', maskUrl(layer.src));
  element.style.setProperty('--layer-depth', `${index * 0.35}px`);
  element.style.setProperty('--layer-foil-opacity', ((supportTreatment?.intensity ?? layer.style.foilIntensity) / 100) * revealIntensity);
  element.style.setProperty('--layer-grid-opacity', Math.min(0.72, 0.24 + layer.style.foilIntensity / 240));
  element.style.setProperty('--layer-glitter-opacity', layer.style.glitterIntensity / 100);
  element.style.setProperty('--layer-grid-size', `${layer.style.gridSize}px`);
  element.style.setProperty('--layer-grid-gap', `${layer.style.gridSize * 0.55}px`);
  element.style.setProperty('--layer-grid-line', `${layer.style.gridSize * 0.62}px`);
  element.style.setProperty('--layer-grid-end', `${layer.style.gridSize * 0.78}px`);
  element.style.setProperty('--layer-angle', `${layer.style.angle}deg`);
  element.innerHTML = `<img alt="${escapeHtml(layer.name)}" draggable="false">${textures.map(textureMarkup).join('')}<div class="art-layer-effect holo-rainbow"></div>`;
  element.querySelector('img').src = layer.src;

  const foil = element.querySelector('.holo-rainbow');
  foil.style.backgroundImage = createMaterialBackground(supportTreatment, production?.support?.angle ?? layer.style.angle);
  foil.style.mixBlendMode = supportTreatment?.blendMode || layer.style.blendMode;
  return element;
}

export function renderLayerStack(layers, target = document.querySelector('#contentLayers'), production = null) {
  target.replaceChildren(...layers.map((layer, index) => (
    buildLayerElement(layer, index, layers, production)
  )));
}
