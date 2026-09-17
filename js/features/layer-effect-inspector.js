import { createHolographicTreatment } from '../models/holographic-treatment.js';
import { getPropagatedSupportSources } from '../models/support-propagation.js';
import { getPropagatedTextureSources } from '../models/texture.js';
import { textureCatalog } from '../models/textures/texture-catalog.js';
import { escapeHtml } from '../utils/dom.js';

const palettes = [['prism', 'Prisme'], ['aurora', 'Aurore'], ['solar', 'Solaire'], ['ice', 'Glace']];
const profiles = {
  crosshatch: [['dispersion', 'Dispersion chromatique', 75, 100], ['highlightWidth', 'Largeur du reflet', 40, 100], ['directionContrast', 'Contraste des directions', 60, 100], ['lightResponse', 'Sensibilité à l’inclinaison', 100, 150]],
  sparkle: [['colorShift', 'Variation chromatique', 80, 100], ['highlightSharpness', 'Netteté des éclats', 65, 100], ['lightResponse', 'Sensibilité à l’inclinaison', 100, 150]],
  zigzag: [['faceAlternation', 'Alternance des faces', 75, 100], ['edgeHighlight', 'Intensité des arêtes', 55, 100], ['directionality', 'Sensibilité directionnelle', 90, 150], ['dispersion', 'Dispersion chromatique', 65, 100]],
  facets: [['facetContrast', 'Contraste des facettes', 70, 100], ['apparentDepth', 'Profondeur apparente', 45, 100], ['colorVariation', 'Variation chromatique', 75, 100], ['highlightSharpness', 'Netteté des reflets', 60, 100], ['lightResponse', 'Sensibilité à l’inclinaison', 100, 150]]
};

const range = (label, value, min, max, property, suffix = '%', step = 1) => `
  <label class="range-field"><span><b>${label}</b><output>${value}${suffix}</output></span>
  <input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-property="${property}" data-suffix="${suffix}"></label>`;

export function initLayerEffectInspector(store, renderAll, renderLayerStack) {
  const root = document.querySelector('#layerEffectInspector');
  const selectedByLayer = new Map();

  function entries(layer) {
    const result = [];
    if (layer.supportInteraction?.mode === 'reveal') result.push({ key: 'support-local', kind: 'support', local: true, label: 'Support' });
    layer.textures.forEach((texture) => result.push({ key: `texture-${texture.id}`, kind: 'texture', local: true, label: textureCatalog[texture.type]?.label || texture.type, texture }));
    getPropagatedSupportSources(layer, store.layers).forEach((source) => result.push({ key: `support-from-${source.id}`, kind: 'support', local: false, label: 'Support hérité', source }));
    getPropagatedTextureSources(layer, store.layers).forEach((texture) => result.push({ key: `texture-from-${texture.inheritedFrom}-${texture.id}`, kind: 'texture', local: false, label: `${textureCatalog[texture.type]?.label || texture.type} hérité`, source: store.layers.find((item) => item.id === texture.inheritedFrom), texture }));
    return result;
  }

  function inheritedPanel(entry) {
    const sourceIndex = store.layers.findIndex((layer) => layer.id === entry.source?.id);
    const position = sourceIndex < 0 ? '?' : store.layers.length - sourceIndex;
    return `<div class="effect-inherited-panel"><span class="effect-lock">↳</span><div><strong>Effet reçu par propagation</strong><p>${escapeHtml(entry.label.replace(' hérité', ''))} provient du calque ${position} · ${escapeHtml(entry.source?.name || 'Source inconnue')}.</p><small>Modifiez cet effet sur son calque d’origine.</small></div><button type="button" data-go-source="${entry.source?.id || ''}">Voir le calque source</button></div>`;
  }

  function supportPanel(layer) {
    const interaction = layer.supportInteraction;
    return `<div class="effect-panel-heading"><div><strong>Révélation du support</strong><p>Réglages propres au support sur ce calque.</p></div><span>LOCAL</span></div>
      ${range('Intensité de révélation', interaction.intensity ?? 100, 0, 100, 'support.intensity')}`;
  }

  function texturePanel(layer, texture) {
    const definition = textureCatalog[texture.type];
    const treatment = texture.holographicTreatment;
    const animation = texture.digitalAnimation;
    const optical = profiles[texture.type] || [];
    return `<div class="effect-panel-heading"><div><strong>${escapeHtml(definition?.label || texture.type)}</strong><p>Géométrie, réaction holographique et animation de cette texture uniquement.</p></div><span>LOCAL</span></div>
      <div class="effect-settings-grid">${range('Espacement', texture.geometry.spacing, 4, 32, 'texture.geometry.spacing', ' px')}${range('Angle', texture.geometry.angle ?? 55, 0, 180, 'texture.geometry.angle', '°')}</div>
      <label class="effect-toggle-row"><span><b>Traitement holographique</b><small>Fait réagir la texture à la lumière.</small></span><span class="switch"><input type="checkbox" data-property="texture.holographic" ${treatment ? 'checked' : ''}><span></span></span></label>
      ${treatment ? `<div class="effect-settings-grid"><label>Palette spectrale<select data-property="treatment.palette">${palettes.map(([value, label]) => `<option value="${value}" ${treatment.palette === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>${range('Intensité holographique', treatment.intensity ?? 54, 0, 100, 'treatment.intensity')}</div>${optical.map(([property, label, fallback, max]) => range(label, treatment[property] ?? fallback, 0, max, `treatment.${property}`)).join('')}` : ''}
      <div class="digital-only">
        <label class="effect-toggle-row"><span><b>Animation web</b><small>Mouvement autonome, indépendant de l’inclinaison.</small></span><span class="switch"><input type="checkbox" data-property="animation.enabled" ${animation.enabled ? 'checked' : ''}><span></span></span></label>
        ${animation.enabled ? `<div class="effect-settings-grid"><label>Comportement<select data-property="animation.mode"><option value="shimmer" ${animation.mode === 'shimmer' ? 'selected' : ''}>Scintillement</option><option value="drift" ${animation.mode === 'drift' ? 'selected' : ''}>Glissement</option><option value="pulse" ${animation.mode === 'pulse' ? 'selected' : ''}>Pulsation</option></select></label>${range('Vitesse', animation.speed || 1, .25, 3, 'animation.speed', '×', .25)}</div>` : ''}
      </div>`;
  }

  function render() {
    const layer = store.selectedLayer;
    if (!layer) return;
    const available = entries(layer);
    if (!available.length) {
      root.innerHTML = '<div class="effect-inspector-empty"><strong>Aucun effet actif</strong><p>Révélez le support ou ajoutez une texture depuis la vignette du calque.</p></div>';
      return;
    }
    let selectedKey = selectedByLayer.get(layer.id);
    if (!available.some((entry) => entry.key === selectedKey)) selectedKey = available[0].key;
    selectedByLayer.set(layer.id, selectedKey);
    const selected = available.find((entry) => entry.key === selectedKey);
    root.innerHTML = `<div class="effect-tabs" role="tablist">${available.map((entry) => `<button type="button" role="tab" data-effect-key="${entry.key}" aria-selected="${entry.key === selectedKey}" class="${entry.key === selectedKey ? 'active' : ''}${entry.local ? '' : ' inherited'}">${entry.local ? '' : '↳ '}${escapeHtml(entry.label)}</button>`).join('')}</div><div class="effect-inspector-panel">${selected.local ? (selected.kind === 'support' ? supportPanel(layer) : texturePanel(layer, selected.texture)) : inheritedPanel(selected)}</div>`;
  }

  root.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-effect-key]');
    if (tab) { selectedByLayer.set(store.selectedLayerId, tab.dataset.effectKey); render(); return; }
    const sourceButton = event.target.closest('[data-go-source]');
    if (sourceButton?.dataset.goSource) { store.selectLayer(sourceButton.dataset.goSource); renderAll(); }
  });

  root.addEventListener('input', update);
  root.addEventListener('change', update);

  function setNestedValue(target, path, value) {
    const keys = path.split('.');
    const property = keys.pop();
    const container = keys.reduce((current, key) => current?.[key], target);
    if (container && property) container[property] = value;
  }

  function update(event) {
    const property = event.target.dataset.property;
    if (!property) return;
    const layer = store.selectedLayer;
    const active = entries(layer).find((entry) => entry.key === selectedByLayer.get(layer.id));
    if (!active?.local) return;
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.type === 'range' ? Number(event.target.value) : event.target.value;
    if (property === 'support.intensity') layer.supportInteraction.intensity = value;
    else if (property === 'texture.holographic') active.texture.holographicTreatment = value ? createHolographicTreatment(layer.style, 'texture', textureCatalog[active.texture.type]?.treatmentDefaults || {}) : null;
    else if (property === 'animation.enabled') {
      active.texture.digitalAnimation.enabled = value;
      if (value && active.texture.digitalAnimation.mode === 'none') active.texture.digitalAnimation.mode = 'shimmer';
    }
    else {
      const [scope, ...path] = property.split('.');
      const target = scope === 'texture' ? active.texture : scope === 'treatment' ? active.texture.holographicTreatment : active.texture.digitalAnimation;
      if (target) setNestedValue(target, path.join('.'), value);
    }
    if (event.target.matches('input[type="range"]')) event.target.closest('label').querySelector('output').textContent = `${value}${event.target.dataset.suffix || '%'}`;
    if (event.type === 'change' || event.target.type === 'checkbox' || event.target.tagName === 'SELECT') renderAll();
    else renderLayerStack();
  }

  return { render };
}
