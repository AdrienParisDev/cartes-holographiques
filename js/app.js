const card = document.querySelector('#holoCard');
const stage = document.querySelector('#cardStage');
const ambientGlow = document.querySelector('.ambient-glow');
const defaults = { glarePower: 48, glareSpread: 36, rotationX: 14, rotationY: 18, perspective: 800 };
const motion = { rotationX: defaults.rotationX, rotationY: defaults.rotationY };

const palettes = {
  prism: ['#ff3e91', '#ffdb67', '#5affe0', '#5aa2ff', '#cb6dff', '#ff3e91'],
  aurora: ['#25f4c7', '#55a7ff', '#b05cff', '#ff66bf', '#25f4c7'],
  solar: ['#ff4f70', '#ff9d3d', '#ffe173', '#ff64bb', '#ff4f70'],
  ice: ['#e8fbff', '#7ee8ff', '#7897ff', '#d2b4ff', '#e8fbff']
};
const patternCatalog = {
  crosshatch: { label: 'Lignes croisées', className: 'holo-grid', color: 'cyan' },
  sparkle: { label: 'Scintillement', className: 'holo-grain', color: 'gold' },
  zigzag: { label: 'Zigzags', className: 'holo-zigzag', color: 'violet' },
  facets: { label: 'Facettes', className: 'holo-facets', color: 'pink' }
};
const defaultLayerStyle = (overrides = {}) => ({ foilType: 'crosshatch', palette: 'prism', foilIntensity: 54, gridSize: 12, glitterIntensity: 23, blendMode: 'color-dodge', angle: 55, ...overrides });
const makeHolographicTreatment = (style, target = 'texture') => ({ id: crypto.randomUUID(), target, material: style.foilType, palette: style.palette, intensity: style.foilIntensity, blendMode: style.blendMode, lightResponse: 'reactive' });
const makeTexture = (type, style, options = {}) => ({ id: crypto.randomUUID(), type, geometry: { spacing: style.gridSize, angle: style.angle }, holographicTreatment: options.holographic ? makeHolographicTreatment(style) : null, digitalAnimation: { enabled: Boolean(options.animated), mode: options.animated ? 'shimmer' : 'none', speed: options.animated ? 1 : 1 }, propagateDown: Boolean(options.propagateDown) });
const makeLayer = (name, src, treatment = {}, style = {}) => {
  const layerStyle = defaultLayerStyle(style);
  return { id: crypto.randomUUID(), name, src, visible: true, clip: true, imageTreatment: treatment.reflection ? makeHolographicTreatment(layerStyle, 'image') : null, textures: (treatment.patterns || []).map((type) => makeTexture(type, layerStyle, { holographic: true, animated: type === 'sparkle' })), style: layerStyle };
};
const exampleLayers = () => [
  makeLayer('Ciel', 'assets/paris-master-layers/04-sky-background.png', {}, { palette: 'solar', foilIntensity: 30 }),
  makeLayer('Tour Eiffel', 'assets/paris-master-layers/03-eiffel-distance.png', { reflection: true }, { foilType: 'etched', palette: 'solar', foilIntensity: 52, blendMode: 'screen' }),
  makeLayer('Ville', 'assets/paris-master-layers/02-middle-city.png', { patterns: ['crosshatch'] }, { palette: 'ice', foilIntensity: 45, gridSize: 10, angle: 55 }),
  makeLayer('Personnage & toit', 'assets/paris-master-layers/01-foreground-person-roof.png', { patterns: ['sparkle'] }, { palette: 'aurora', glitterIntensity: 40 })
];
let layers = exampleLayers();
let selectedLayerId = layers.at(-1).id;
let importMode = 'replace';
const selectedLayer = () => layers.find((layer) => layer.id === selectedLayerId);
function effectiveTextures(layer, sourceLayers = layers) {
  const targetIndex = sourceLayers.findIndex((entry) => entry.id === layer.id);
  const textures = layer.textures.map((texture) => ({ ...texture, inheritedFrom: null }));
  sourceLayers.slice(targetIndex + 1).forEach((source) => source.textures.filter((texture) => texture.propagateDown).forEach((texture) => {
    if (!textures.some((entry) => entry.type === texture.type)) textures.push({ ...texture, inheritedFrom: source.id, inheritedFromName: source.name });
  }));
  return textures;
}
const findOwnTexture = (layer, type) => layer.textures.find((texture) => texture.type === type);
const maskUrl = (src) => {
  const source = String(src);
  const resolved = source.startsWith('data:') || source.startsWith('blob:') ? source : new URL(source, document.baseURI).href;
  return `url("${resolved.replaceAll('"', '%22')}")`;
};
const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);
function foilBackground(layer) {
  const colors = palettes[layer.style.palette] || palettes.prism;
  const spectrum = `linear-gradient(${layer.style.angle + 60}deg,${colors.join(',')})`;
  if (layer.style.foilType === 'galaxy') return `radial-gradient(circle at var(--x) var(--y),rgba(255,255,255,.9) 0 1px,transparent 2px),${spectrum}`;
  if (layer.style.foilType === 'etched') return `repeating-linear-gradient(${layer.style.angle}deg,rgba(255,255,255,.32) 0 1px,transparent 1px 7px),${spectrum}`;
  if (layer.style.foilType === 'rainbow') return spectrum;
  return `repeating-linear-gradient(${layer.style.angle}deg,rgba(255,255,255,.18) 0 1px,transparent 1px 8px),${spectrum}`;
}

function buildLayerElement(layer, index, sourceLayers = layers) {
  const textures = effectiveTextures(layer, sourceLayers);
  const element = document.createElement('div');
  element.className = `art-layer${layer.clip ? ' clip-effects' : ''}${layer.imageTreatment ? ' effect-foil' : ''}${textures.some((texture) => texture.type === 'crosshatch') ? ' effect-grid' : ''}${textures.some((texture) => texture.type === 'sparkle') ? ' effect-glitter' : ''}${textures.some((texture) => texture.type === 'zigzag') ? ' effect-zigzag' : ''}${textures.some((texture) => texture.type === 'facets') ? ' effect-facets' : ''}`;
  element.dataset.layerId = layer.id;
  element.hidden = !layer.visible;
  element.style.setProperty('--layer-mask', maskUrl(layer.src));
  element.style.setProperty('--layer-depth', `${index * 0.35}px`);
  element.style.setProperty('--layer-foil-opacity', layer.style.foilIntensity / 100);
  element.style.setProperty('--layer-grid-opacity', Math.min(0.72, 0.24 + layer.style.foilIntensity / 240));
  element.style.setProperty('--layer-glitter-opacity', layer.style.glitterIntensity / 100);
  element.style.setProperty('--layer-grid-size', `${layer.style.gridSize}px`);
  element.style.setProperty('--layer-grid-gap', `${layer.style.gridSize * 0.55}px`);
  element.style.setProperty('--layer-grid-line', `${layer.style.gridSize * 0.62}px`);
  element.style.setProperty('--layer-grid-end', `${layer.style.gridSize * 0.78}px`);
  element.style.setProperty('--layer-angle', `${layer.style.angle}deg`);
  const patternElements = textures.map((texture) => {
    if (!patternCatalog[texture.type]) return '';
    const spacing = texture.geometry.spacing;
    const material = texture.holographicTreatment?.material || 'matte';
    const animationMode = texture.digitalAnimation.enabled ? texture.digitalAnimation.mode : 'none';
    const animationDuration = Math.max(.6, 4 / Math.max(.25, texture.digitalAnimation.speed || 1));
    const treatmentIntensity = (texture.holographicTreatment?.intensity ?? 35) / 100;
    return `<div class="art-layer-effect ${patternCatalog[texture.type].className} material-${material}${texture.holographicTreatment ? ' texture-holographic' : ' texture-matte'}${texture.digitalAnimation.enabled ? ` texture-animated animation-${animationMode}` : ''}" style="--layer-grid-size:${spacing}px;--layer-grid-gap:${spacing * .55}px;--layer-grid-line:${spacing * .62}px;--layer-grid-end:${spacing * .78}px;--texture-treatment-intensity:${treatmentIntensity};--texture-animation-duration:${animationDuration}s"></div>`;
  }).join('');
  element.innerHTML = `<img alt="${escapeHtml(layer.name)}" draggable="false">${patternElements}<div class="art-layer-effect holo-rainbow"></div>`;
  element.querySelector('img').src = layer.src;
  const foil = element.querySelector('.holo-rainbow');
  foil.style.backgroundImage = foilBackground(layer);
  foil.style.mixBlendMode = layer.style.blendMode;
  return element;
}
function renderLayerStack(target = document.querySelector('#contentLayers')) { target.replaceChildren(...layers.map((layer, index) => buildLayerElement(layer, index, layers))); }
function renderLayerManager() {
  const manager = document.querySelector('#layerManager');
  manager.replaceChildren();
  layers.forEach((layer) => {
    const item = document.createElement('div');
    item.className = `layer-item${layer.id === selectedLayerId ? ' selected' : ''}`;
    item.dataset.layerId = layer.id;
    item.innerHTML = `
      <button class="layer-drag-handle" type="button" draggable="true" aria-label="Déplacer ${escapeHtml(layer.name)}" title="Glisser pour réordonner">⠿</button>
      <button class="visibility${layer.visible ? '' : ' off'}" type="button" aria-label="${layer.visible ? 'Masquer' : 'Afficher'} ${escapeHtml(layer.name)}" aria-pressed="${layer.visible}">${layer.visible ? '◉' : '○'}</button>
      <div class="layer-select"><button class="layer-thumb-button" type="button" aria-label="Sélectionner ${escapeHtml(layer.name)}"><img class="layer-thumb" alt=""></button><span class="layer-copy"><input class="layer-inline-name" type="text" maxlength="60" value="${escapeHtml(layer.name)}" aria-label="Nom du calque"><span class="layer-inline-effects"></span></span></div>
      <span class="layer-position" title="Position dans la pile">${layers.length - layers.indexOf(layer)}</span>
      <div class="layer-quick-actions"><button class="layer-resize" type="button" aria-label="Redimensionner ${escapeHtml(layer.name)}" title="Redimensionner">⤢</button><button class="layer-replace" type="button" aria-label="Remplacer l’image de ${escapeHtml(layer.name)}" title="Remplacer l’image">✎</button><button class="layer-remove" type="button" aria-label="Supprimer ${escapeHtml(layer.name)}" title="Supprimer" ${layers.length === 1 ? 'disabled' : ''}>⌫</button></div>`;
    item.querySelector('.layer-thumb').src = layer.src;
    const selectLayer = () => { selectedLayerId = layer.id; renderLayerManager(); syncLayerControls(); renderEffectLegend(); renderLegend(); };
    item.querySelector('.layer-thumb-button').addEventListener('click', selectLayer);
    item.querySelector('.visibility').addEventListener('click', () => { selectedLayerId = layer.id; layer.visible = !layer.visible; renderAll(); });
    const treatmentContainer = item.querySelector('.layer-inline-effects');
    const reflectionButton = document.createElement('button');
    reflectionButton.type = 'button';
    reflectionButton.className = `layer-treatment-chip reflection${layer.imageTreatment ? ' active' : ''}`;
    reflectionButton.textContent = layer.imageTreatment ? 'Reflet sur l’image ×' : '+ Reflet sur l’image';
    reflectionButton.setAttribute('aria-pressed', String(Boolean(layer.imageTreatment)));
    reflectionButton.addEventListener('click', () => { selectedLayerId = layer.id; layer.imageTreatment = layer.imageTreatment ? null : makeHolographicTreatment(layer.style, 'image'); renderAll(); });
    treatmentContainer.appendChild(reflectionButton);
    effectiveTextures(layer).forEach((texture) => {
      const definition = patternCatalog[texture.type]; if (!definition) return;
      const chip = document.createElement('span');
      chip.className = `layer-treatment-chip pattern ${definition.color}${texture.inheritedFrom ? ' inherited' : ''}`;
      chip.innerHTML = `<span>${texture.inheritedFrom ? '↳ ' : ''}${definition.label}</span><button type="button" aria-label="${texture.inheritedFrom ? `Texture liée depuis ${texture.inheritedFromName}` : `Retirer la texture ${definition.label}`}" title="${texture.inheritedFrom ? `Liée à ${texture.inheritedFromName}` : 'Retirer cette texture'}">${texture.inheritedFrom ? '⛓' : '⌫'}</button>`;
      if (texture.inheritedFrom) chip.querySelector('button').disabled = true;
      else chip.querySelector('button').addEventListener('click', () => { selectedLayerId = layer.id; layer.textures = layer.textures.filter((entry) => entry.id !== texture.id); renderAll(); });
      treatmentContainer.appendChild(chip);
    });
    const patternButton = document.createElement('button');
    patternButton.type = 'button'; patternButton.className = 'layer-pattern-add'; patternButton.textContent = '+ Ajouter une texture';
    patternButton.addEventListener('click', () => openPatternDialog(layer));
    treatmentContainer.appendChild(patternButton);
    const nameInput = item.querySelector('.layer-inline-name');
    nameInput.addEventListener('focus', () => {
      selectedLayerId = layer.id;
      manager.querySelectorAll('.layer-item').forEach((entry) => entry.classList.toggle('selected', entry === item));
      syncLayerControls(); renderEffectLegend(); renderLegend();
    });
    nameInput.addEventListener('click', (event) => event.stopPropagation());
    nameInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); nameInput.blur(); } });
    nameInput.addEventListener('input', () => {
      layer.name = nameInput.value || 'Calque sans titre';
      document.querySelector('#layerName').value = layer.name;
      document.querySelector('#selectedLayerLabel').textContent = layer.name;
      document.querySelector('#previewEffectLayerName').textContent = layer.name;
      document.querySelector('.upload-box strong').textContent = layer.name;
      renderLegend(); renderLayerStack();
    });
    nameInput.addEventListener('change', renderAll);
    item.querySelector('.layer-resize').addEventListener('click', () => openExistingLayerInCrop(layer));
    item.querySelector('.layer-replace').addEventListener('click', () => { selectedLayerId = layer.id; importMode = 'replace'; imageInput.click(); });
    item.querySelector('.layer-remove').addEventListener('click', () => deleteLayerById(layer.id));
    const dragHandle = item.querySelector('.layer-drag-handle');
    dragHandle.addEventListener('dragstart', (event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', layer.id); item.classList.add('dragging'); });
    dragHandle.addEventListener('dragend', () => { item.classList.remove('dragging'); manager.querySelectorAll('.drag-over').forEach((node) => node.classList.remove('drag-over')); });
    item.addEventListener('dragover', (event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; item.classList.add('drag-over'); });
    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
    item.addEventListener('drop', (event) => {
      event.preventDefault(); item.classList.remove('drag-over');
      const draggedId = event.dataTransfer.getData('text/plain');
      if (!draggedId || draggedId === layer.id) return;
      const displayOrder = [...layers].reverse().map((entry) => entry.id).filter((id) => id !== draggedId);
      const targetIndex = displayOrder.indexOf(layer.id);
      const insertAfter = event.clientY > item.getBoundingClientRect().top + item.offsetHeight / 2;
      displayOrder.splice(targetIndex + (insertAfter ? 1 : 0), 0, draggedId);
      const byId = new Map(layers.map((entry) => [entry.id, entry]));
      layers = displayOrder.reverse().map((id) => byId.get(id));
      selectedLayerId = draggedId; renderAll();
    });
    manager.appendChild(item);
  });
}
function renderLegend() {
  const legend = document.querySelector('#previewLayerLegend');
  legend.replaceChildren();
  [...layers].reverse().forEach((layer, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = `layer-toggle${layer.visible ? ' active' : ''}${layer.id === selectedLayerId ? ' selected' : ''}`;
    button.setAttribute('aria-pressed', String(layer.visible));
    button.innerHTML = `<i style="background:hsl(${265 - index * 42} 80% 68%)"></i>${escapeHtml(layer.name)}<b>●</b>`;
    button.addEventListener('click', () => { layer.visible = !layer.visible; renderAll(); });
    legend.appendChild(button);
  });
}
function renderEffectLegend() {
  const layer = selectedLayer();
  document.querySelector('#previewEffectLayerName').textContent = layer.name;
  const legend = document.querySelector('#previewEffectLegend');
  legend.replaceChildren();
  const effects = [{ key: 'reflection', label: 'Reflet image', color: 'pink' }, { key: 'crosshatch', label: 'Texture lignes', color: 'cyan' }, { key: 'sparkle', label: 'Texture points', color: 'gold' }];
  effects.forEach(({ key, label, color }) => {
    const button = document.createElement('button');
    button.type = 'button';
    const enabled = key === 'reflection' ? Boolean(layer.imageTreatment) : effectiveTextures(layer).some((texture) => texture.type === key);
    button.className = `effect-preview-toggle${enabled ? ' active' : ''}`;
    button.setAttribute('aria-pressed', String(enabled));
    button.innerHTML = `<i class="${color}"></i>${label}`;
    button.addEventListener('click', () => { if (key === 'reflection') layer.imageTreatment = layer.imageTreatment ? null : makeHolographicTreatment(layer.style, 'image'); else { const own = findOwnTexture(layer, key); layer.textures = own ? layer.textures.filter((texture) => texture.id !== own.id) : [...layer.textures, makeTexture(key, layer.style)]; } renderAll(); });
    legend.appendChild(button);
  });
}
function syncLayerControls() {
  const layer = selectedLayer(); if (!layer) return;
  document.querySelector('#clipEffects').checked = layer.clip;
  document.querySelector('#layerFoil').checked = Boolean(layer.imageTreatment);
  document.querySelector('#layerGrid').checked = effectiveTextures(layer).some((texture) => texture.type === 'crosshatch');
  document.querySelector('#layerGlitter').checked = effectiveTextures(layer).some((texture) => texture.type === 'sparkle');
  document.querySelector('.upload-box strong').textContent = layer.name;
  document.querySelector('#layerName').value = layer.name;
  document.querySelector('#layerCount').textContent = `${layers.length} calque${layers.length > 1 ? 's' : ''}`;
  document.querySelector('#selectedLayerLabel').textContent = layer.name;
  document.querySelector('#selectedLayerThumb').src = layer.src;
  document.querySelector('#foilType').value = layer.style.foilType;
  document.querySelector('#foilIntensity').value = layer.style.foilIntensity;
  document.querySelector('#foilIntensityValue').textContent = `${layer.style.foilIntensity}%`;
  document.querySelector('#gridSize').value = layer.style.gridSize;
  document.querySelector('#gridSizeValue').textContent = `${layer.style.gridSize} px`;
  document.querySelector('#glitterIntensity').value = layer.style.glitterIntensity;
  document.querySelector('#glitterIntensityValue').textContent = `${layer.style.glitterIntensity}%`;
  document.querySelector('#blendMode').value = layer.style.blendMode;
  document.querySelector('#foilAngle').value = String(layer.style.angle);
  document.querySelectorAll('[data-palette]').forEach((button) => button.classList.toggle('selected', button.dataset.palette === layer.style.palette));
  const index = layers.indexOf(layer);
  document.querySelector('#moveLayerUp').disabled = index === layers.length - 1;
  document.querySelector('#moveLayerDown').disabled = index === 0;
  document.querySelector('#deleteLayer').disabled = layers.length === 1;
}
function renderAll() { renderLayerStack(); renderLayerManager(); renderLegend(); syncLayerControls(); renderEffectLegend(); }

const patternDialog = document.querySelector('#patternDialog');
const patternPreview = document.querySelector('#patternPreview');
const patternDraft = { layerId: null, textures: {}, previewMode: 'selected' };
document.querySelectorAll('.pattern-choice-controls').forEach((panel) => panel.insertAdjacentHTML('beforeend', `
  <div class="texture-property-block">
    <label class="texture-property-toggle"><span><b>Traitement holographique</b><small>Réaction de la matière à la lumière</small></span><span class="switch"><input class="texture-holo-toggle" type="checkbox"><span></span></span></label>
    <div class="texture-property-settings texture-holo-settings" hidden>
      <label>Aspect<select class="texture-material"><option value="crosshatch">Rayons croisés</option><option value="galaxy">Galaxie</option><option value="rainbow">Arc-en-ciel</option><option value="etched">Métal gravé</option></select></label>
      <label class="mini-range"><span>Intensité <output class="texture-intensity-output">54%</output></span><input class="texture-intensity" type="range" min="0" max="100" value="54"></label>
    </div>
  </div>
  <div class="texture-property-block digital-only">
    <label class="texture-property-toggle"><span><b>Animation web</b><small>Option numérique, non imprimable</small></span><span class="switch"><input class="texture-animation-toggle" type="checkbox"><span></span></span></label>
    <div class="texture-property-settings texture-animation-settings" hidden>
      <label>Comportement<select class="texture-animation-mode"><option value="shimmer">Scintillement</option><option value="drift">Glissement</option><option value="pulse">Pulsation</option></select></label>
      <label class="mini-range"><span>Vitesse <output class="texture-speed-output">1×</output></span><input class="texture-speed" type="range" min="0.25" max="3" step="0.25" value="1"></label>
    </div>
  </div>`));
function renderPatternPreview() {
  const layer = layers.find((entry) => entry.id === patternDraft.layerId); if (!layer) return;
  const draftLayer = { ...layer, textures: Object.values(patternDraft.textures).map((texture) => structuredClone(texture)) };
  const selectedIndex = layers.indexOf(layer);
  const previewLayers = patternDraft.previewMode === 'all' ? layers.map((entry, index) => {
    if (entry.id === layer.id) return draftLayer;
    if (index >= selectedIndex) return entry;
    const previewTextures = entry.textures.map((texture) => structuredClone(texture));
    Object.values(patternDraft.textures).filter((texture) => texture.propagateDown).forEach((texture) => { if (!previewTextures.some((entryTexture) => entryTexture.type === texture.type)) previewTextures.push(structuredClone(texture)); });
    return { ...entry, textures: previewTextures };
  }) : [draftLayer];
  patternPreview.classList.toggle('patterns-only', patternDraft.previewMode === 'none');
  patternPreview.replaceChildren(...previewLayers.map((previewLayer, index) => buildLayerElement(previewLayer, index, previewLayers)));
  const textureCount = Object.keys(patternDraft.textures).length;
  document.querySelector('#patternSelectionCount').textContent = `${textureCount} texture${textureCount > 1 ? 's' : ''} sélectionnée${textureCount > 1 ? 's' : ''}`;
  document.querySelector('#applyPatterns').disabled = textureCount === 0;
  document.querySelectorAll('.pattern-choice').forEach((choice) => {
    const pattern = choice.dataset.pattern; const texture = patternDraft.textures[pattern]; const active = Boolean(texture);
    choice.querySelector('.pattern-choice-toggle').checked = active; choice.classList.toggle('active', active);
    choice.querySelector('.pattern-choice-controls').hidden = !active;
    const spacing = texture?.geometry.spacing ?? layer.style.gridSize;
    choice.querySelector('.pattern-spacing-input').value = spacing; choice.querySelector('.pattern-spacing-output').textContent = `${spacing} px`;
    choice.querySelector('.pattern-propagate').checked = Boolean(texture?.propagateDown);
    const holo = texture?.holographicTreatment;
    choice.querySelector('.texture-holo-toggle').checked = Boolean(holo); choice.querySelector('.texture-holo-settings').hidden = !holo;
    choice.querySelector('.texture-material').value = holo?.material || 'crosshatch';
    choice.querySelector('.texture-intensity').value = holo?.intensity ?? layer.style.foilIntensity; choice.querySelector('.texture-intensity-output').textContent = `${holo?.intensity ?? layer.style.foilIntensity}%`;
    const animation = texture?.digitalAnimation;
    choice.querySelector('.texture-animation-toggle').checked = Boolean(animation?.enabled); choice.querySelector('.texture-animation-settings').hidden = !animation?.enabled;
    choice.querySelector('.texture-animation-mode').value = animation?.mode === 'none' ? 'shimmer' : (animation?.mode || 'shimmer');
    choice.querySelector('.texture-speed').value = animation?.speed || 1; choice.querySelector('.texture-speed-output').textContent = `${animation?.speed || 1}×`;
  });
}
function openPatternDialog(layer) {
  selectedLayerId = layer.id; patternDraft.layerId = layer.id; patternDraft.textures = Object.fromEntries(layer.textures.map((texture) => [texture.type, structuredClone(texture)])); patternDraft.previewMode = 'selected';
  document.querySelector('#patternTargetName').textContent = layer.name;
  document.querySelectorAll('[name="patternPreviewMode"]').forEach((input) => { input.checked = input.value === 'selected'; });
  renderPatternPreview(); patternDialog.showModal();
}
document.querySelectorAll('.pattern-choice').forEach((choice) => {
  const pattern = choice.dataset.pattern;
  choice.querySelector('.pattern-choice-toggle').addEventListener('change', (event) => { if (event.target.checked) patternDraft.textures[pattern] = makeTexture(pattern, selectedLayer().style); else delete patternDraft.textures[pattern]; renderPatternPreview(); });
  choice.querySelector('.pattern-spacing-input').addEventListener('input', (event) => { patternDraft.textures[pattern].geometry.spacing = Number(event.target.value); renderPatternPreview(); });
  choice.querySelector('.pattern-propagate').addEventListener('change', (event) => { patternDraft.textures[pattern].propagateDown = event.target.checked; renderPatternPreview(); });
  choice.querySelector('.texture-holo-toggle').addEventListener('change', (event) => { patternDraft.textures[pattern].holographicTreatment = event.target.checked ? makeHolographicTreatment(selectedLayer().style) : null; renderPatternPreview(); });
  choice.querySelector('.texture-material').addEventListener('change', (event) => { patternDraft.textures[pattern].holographicTreatment.material = event.target.value; renderPatternPreview(); });
  choice.querySelector('.texture-intensity').addEventListener('input', (event) => { patternDraft.textures[pattern].holographicTreatment.intensity = Number(event.target.value); renderPatternPreview(); });
  choice.querySelector('.texture-animation-toggle').addEventListener('change', (event) => { const animation = patternDraft.textures[pattern].digitalAnimation; animation.enabled = event.target.checked; animation.mode = event.target.checked && animation.mode === 'none' ? 'shimmer' : animation.mode; renderPatternPreview(); });
  choice.querySelector('.texture-animation-mode').addEventListener('change', (event) => { patternDraft.textures[pattern].digitalAnimation.mode = event.target.value; renderPatternPreview(); });
  choice.querySelector('.texture-speed').addEventListener('input', (event) => { patternDraft.textures[pattern].digitalAnimation.speed = Number(event.target.value); renderPatternPreview(); });
});
document.querySelectorAll('[name="patternPreviewMode"]').forEach((input) => input.addEventListener('change', () => { patternDraft.previewMode = input.value; renderPatternPreview(); }));
document.querySelector('#applyPatterns').addEventListener('click', () => {
  const layer = layers.find((entry) => entry.id === patternDraft.layerId); if (!layer) return;
  layer.textures = Object.values(patternDraft.textures).map((texture) => structuredClone(texture));
  patternDialog.close(); renderAll();
});
['closePatternDialog', 'cancelPatterns'].forEach((id) => document.querySelector(`#${id}`).addEventListener('click', () => patternDialog.close()));
patternDialog.addEventListener('cancel', (event) => { event.preventDefault(); patternDialog.close(); });

function setCardPosition(x = 0.5, y = 0.5) {
  card.style.setProperty('--x', `${x * 100}%`); card.style.setProperty('--y', `${y * 100}%`);
  card.style.setProperty('--rx', `${(0.5 - y) * motion.rotationX * 2}deg`);
  card.style.setProperty('--ry', `${(x - 0.5) * motion.rotationY * 2}deg`);
}
stage.addEventListener('pointermove', (event) => {
  const bounds = card.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
  const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
  card.classList.add('interacting'); setCardPosition(x, y);
});
stage.addEventListener('pointerleave', () => { card.classList.remove('interacting'); setCardPosition(); });

function updateLight() {
  const power = Number(document.querySelector('#glarePower').value); const spread = Number(document.querySelector('#glareSpread').value);
  card.style.setProperty('--glare-opacity', power / 100); card.style.setProperty('--glare-spread', `${spread}%`);
  document.querySelector('#glarePowerValue').textContent = `${power}%`; document.querySelector('#glareSpreadValue').textContent = `${spread}%`;
}
function updateMotion() {
  motion.rotationX = Number(document.querySelector('#rotationX').value); motion.rotationY = Number(document.querySelector('#rotationY').value);
  const perspective = Number(document.querySelector('#perspective').value); stage.style.perspective = `${perspective}px`;
  document.querySelector('#rotationXValue').textContent = `± ${motion.rotationX}°`; document.querySelector('#rotationYValue').textContent = `± ${motion.rotationY}°`;
  document.querySelector('#perspectiveValue').textContent = `${perspective} px`;
}
['glarePower', 'glareSpread'].forEach((id) => document.querySelector(`#${id}`).addEventListener('input', updateLight));
['rotationX', 'rotationY', 'perspective'].forEach((id) => document.querySelector(`#${id}`).addEventListener('input', updateMotion));
document.querySelector('#resetLight').addEventListener('click', () => { document.querySelector('#glarePower').value = defaults.glarePower; document.querySelector('#glareSpread').value = defaults.glareSpread; updateLight(); });
document.querySelector('#resetMotion').addEventListener('click', () => { ['rotationX', 'rotationY', 'perspective'].forEach((id) => { document.querySelector(`#${id}`).value = defaults[id]; }); updateMotion(); setCardPosition(); });
document.querySelector('#springMotion').addEventListener('change', (event) => card.classList.toggle('no-spring', !event.target.checked));
document.querySelectorAll('[data-finish]').forEach((checkbox) => {
  const apply = () => checkbox.dataset.finish === 'halo' ? ambientGlow.classList.toggle('is-hidden', !checkbox.checked) : card.classList.toggle(`finish-${checkbox.dataset.finish}`, checkbox.checked);
  checkbox.addEventListener('change', apply); apply();
});
document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => { document.querySelectorAll('.tab').forEach((item) => item.classList.remove('active')); tab.classList.add('active'); document.querySelector(`[data-section="${tab.dataset.target}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
document.querySelector('#cardName').addEventListener('input', (event) => { document.querySelector('#previewCardName').textContent = event.target.value.trim() || 'Carte sans titre'; });
document.querySelector('#layerFoil').addEventListener('change', (event) => { const layer = selectedLayer(); layer.imageTreatment = event.target.checked ? makeHolographicTreatment(layer.style, 'image') : null; renderAll(); });
document.querySelector('#layerGrid').addEventListener('change', (event) => { const layer = selectedLayer(); const texture = findOwnTexture(layer, 'crosshatch'); if (event.target.checked && !texture) layer.textures.push(makeTexture('crosshatch', layer.style)); else if (!event.target.checked && texture) layer.textures = layer.textures.filter((entry) => entry.id !== texture.id); renderAll(); });
document.querySelector('#layerGlitter').addEventListener('change', (event) => { const layer = selectedLayer(); const texture = findOwnTexture(layer, 'sparkle'); if (event.target.checked && !texture) layer.textures.push(makeTexture('sparkle', layer.style, { animated: true })); else if (!event.target.checked && texture) layer.textures = layer.textures.filter((entry) => entry.id !== texture.id); renderAll(); });
document.querySelector('#clipEffects').addEventListener('change', (event) => { selectedLayer().clip = event.target.checked; renderAll(); });
document.querySelector('#layerName').addEventListener('input', (event) => {
  selectedLayer().name = event.target.value || 'Calque sans titre';
  renderLayerStack(); renderLayerManager(); renderLegend();
  document.querySelector('#selectedLayerLabel').textContent = selectedLayer().name;
  document.querySelector('#previewEffectLayerName').textContent = selectedLayer().name;
  document.querySelector('.upload-box strong').textContent = selectedLayer().name;
});
function updateSelectedStyle(property, value) { const layer = selectedLayer(); layer.style[property] = value; if (property === 'gridSize') layer.textures.forEach((texture) => { texture.geometry.spacing = value; }); if (layer.imageTreatment) { layer.imageTreatment.material = layer.style.foilType; layer.imageTreatment.palette = layer.style.palette; layer.imageTreatment.intensity = layer.style.foilIntensity; layer.imageTreatment.blendMode = layer.style.blendMode; } renderLayerStack(); }
document.querySelector('#foilType').addEventListener('change', (event) => updateSelectedStyle('foilType', event.target.value));
document.querySelector('#blendMode').addEventListener('change', (event) => updateSelectedStyle('blendMode', event.target.value));
document.querySelector('#foilAngle').addEventListener('change', (event) => updateSelectedStyle('angle', Number(event.target.value)));
document.querySelector('#foilIntensity').addEventListener('input', (event) => { const value = Number(event.target.value); document.querySelector('#foilIntensityValue').textContent = `${value}%`; updateSelectedStyle('foilIntensity', value); });
document.querySelector('#gridSize').addEventListener('input', (event) => { const value = Number(event.target.value); document.querySelector('#gridSizeValue').textContent = `${value} px`; updateSelectedStyle('gridSize', value); });
document.querySelector('#glitterIntensity').addEventListener('input', (event) => { const value = Number(event.target.value); document.querySelector('#glitterIntensityValue').textContent = `${value}%`; updateSelectedStyle('glitterIntensity', value); });
document.querySelectorAll('[data-palette]').forEach((button) => button.addEventListener('click', () => { selectedLayer().style.palette = button.dataset.palette; document.querySelectorAll('[data-palette]').forEach((item) => item.classList.toggle('selected', item === button)); renderLayerStack(); }));
document.querySelector('#resetLayerEffects').addEventListener('click', () => { selectedLayer().style = defaultLayerStyle(); syncLayerControls(); renderLayerStack(); });
document.querySelector('#moveLayerUp').addEventListener('click', () => moveSelected(1)); document.querySelector('#moveLayerDown').addEventListener('click', () => moveSelected(-1));
function moveSelected(direction) { const index = layers.findIndex((layer) => layer.id === selectedLayerId); const target = index + direction; if (target < 0 || target >= layers.length) return; [layers[index], layers[target]] = [layers[target], layers[index]]; renderAll(); }
function deleteLayerById(id) { if (layers.length === 1) return; const index = layers.findIndex((layer) => layer.id === id); if (index < 0) return; layers.splice(index, 1); selectedLayerId = layers[Math.min(index, layers.length - 1)].id; renderAll(); }
document.querySelector('#deleteLayer').addEventListener('click', () => deleteLayerById(selectedLayerId));
document.querySelector('#restoreDefaultImage').addEventListener('click', () => { layers = exampleLayers(); selectedLayerId = layers.at(-1).id; renderAll(); });

const imageInput = document.querySelector('#imageInput'); const cropDialog = document.querySelector('#cropDialog'); const cropCanvas = document.querySelector('#cropCanvas');
const cropContext = cropCanvas.getContext('2d'); const cropSurface = document.querySelector('#cropSurface'); const cropZoom = document.querySelector('#cropZoom'); const cropError = document.querySelector('#cropError');
const cropState = { image: null, fit: 'cover', zoom: 1, rotation: 0, offsetX: 0, offsetY: 0, dragging: false, pointerX: 0, pointerY: 0, fileName: '' };
function openExistingLayerInCrop(layer) {
  const image = new Image();
  image.onload = () => {
    selectedLayerId = layer.id; importMode = 'replace'; cropState.image = image; cropState.fileName = layer.name;
    document.querySelector('#sourceName').textContent = layer.name;
    document.querySelector('#sourceMeta').textContent = `${image.naturalWidth} × ${image.naturalHeight} px · image actuelle`;
    cropError.textContent = 'Le recadrage repart de l’image actuellement utilisée par ce calque.';
    resetCropState('cover'); cropSurface.classList.toggle('effects-on', document.querySelector('#previewEffects').checked); cropDialog.showModal();
  };
  image.onerror = () => { cropError.textContent = 'Cette image n’a pas pu être rouverte.'; cropDialog.showModal(); };
  image.src = layer.src;
}
document.querySelector('#replaceImage').addEventListener('click', () => { importMode = 'replace'; imageInput.click(); }); document.querySelector('#addLayer').addEventListener('click', () => { importMode = 'add'; imageInput.click(); });
function rotatedDimensions() { const quarter = Math.abs(cropState.rotation / 90) % 2 === 1; return { width: quarter ? cropState.image.height : cropState.image.width, height: quarter ? cropState.image.width : cropState.image.height }; }
function baseCropScale() { const size = rotatedDimensions(); const scales = [cropCanvas.width / size.width, cropCanvas.height / size.height]; return cropState.fit === 'contain' ? Math.min(...scales) : Math.max(...scales); }
function drawCrop() {
  if (!cropState.image) return; cropContext.clearRect(0, 0, cropCanvas.width, cropCanvas.height); const scale = baseCropScale() * cropState.zoom;
  cropContext.save(); cropContext.translate(cropCanvas.width / 2 + cropState.offsetX, cropCanvas.height / 2 + cropState.offsetY); cropContext.rotate(cropState.rotation * Math.PI / 180);
  cropContext.drawImage(cropState.image, -cropState.image.width * scale / 2, -cropState.image.height * scale / 2, cropState.image.width * scale, cropState.image.height * scale); cropContext.restore();
}
function resetCropState(fit = cropState.fit) { Object.assign(cropState, { fit, zoom: 1, rotation: 0, offsetX: 0, offsetY: 0 }); cropZoom.value = 100; document.querySelector('#cropZoomValue').textContent = '100%'; document.querySelector('#fitContain').classList.toggle('selected', fit === 'contain'); document.querySelector('#fitCover').classList.toggle('selected', fit === 'cover'); drawCrop(); }
function closeCropDialog() { cropDialog.close(); imageInput.value = ''; cropState.image = null; cropError.textContent = ''; }
imageInput.addEventListener('change', () => {
  const file = imageInput.files?.[0]; if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { cropError.textContent = 'Utilisez une image PNG, JPEG ou WebP de moins de 10 Mo.'; cropDialog.showModal(); return; }
  const url = URL.createObjectURL(file); const image = new Image();
  image.onload = () => { URL.revokeObjectURL(url); cropState.image = image; cropState.fileName = file.name.replace(/\.[^.]+$/, ''); document.querySelector('#sourceName').textContent = file.name; document.querySelector('#sourceMeta').textContent = `${image.naturalWidth} × ${image.naturalHeight} px · ${(file.size / 1048576).toFixed(1)} Mo`; cropError.textContent = file.type !== 'image/png' ? 'Sans transparence, les effets couvriront tout le rectangle du calque.' : ''; resetCropState('cover'); cropSurface.classList.toggle('effects-on', document.querySelector('#previewEffects').checked); cropDialog.showModal(); };
  image.onerror = () => { URL.revokeObjectURL(url); cropError.textContent = 'Cette image n’a pas pu être lue.'; cropDialog.showModal(); }; image.src = url;
});
cropZoom.addEventListener('input', () => { cropState.zoom = Number(cropZoom.value) / 100; document.querySelector('#cropZoomValue').textContent = `${cropZoom.value}%`; drawCrop(); });
cropSurface.addEventListener('wheel', (event) => { event.preventDefault(); cropZoom.value = Math.max(25, Math.min(300, Number(cropZoom.value) - Math.sign(event.deltaY) * 8)); cropZoom.dispatchEvent(new Event('input')); }, { passive: false });
cropSurface.addEventListener('pointerdown', (event) => { if (!cropState.image) return; Object.assign(cropState, { dragging: true, pointerX: event.clientX, pointerY: event.clientY }); cropSurface.classList.add('dragging'); cropSurface.setPointerCapture(event.pointerId); });
cropSurface.addEventListener('pointermove', (event) => { if (!cropState.dragging) return; cropState.offsetX += (event.clientX - cropState.pointerX) * cropCanvas.width / cropSurface.clientWidth; cropState.offsetY += (event.clientY - cropState.pointerY) * cropCanvas.height / cropSurface.clientHeight; cropState.pointerX = event.clientX; cropState.pointerY = event.clientY; drawCrop(); });
function stopDragging() { cropState.dragging = false; cropSurface.classList.remove('dragging'); }
cropSurface.addEventListener('pointerup', stopDragging); cropSurface.addEventListener('pointercancel', stopDragging);
document.querySelector('#fitContain').addEventListener('click', () => resetCropState('contain')); document.querySelector('#fitCover').addEventListener('click', () => resetCropState('cover')); document.querySelector('#resetCrop').addEventListener('click', () => resetCropState('cover'));
function rotateCrop(amount) { cropState.rotation = (cropState.rotation + amount + 360) % 360; cropState.offsetX = cropState.offsetY = 0; drawCrop(); }
document.querySelector('#rotateLeft').addEventListener('click', () => rotateCrop(-90)); document.querySelector('#rotateRight').addEventListener('click', () => rotateCrop(90)); document.querySelector('#previewEffects').addEventListener('change', (event) => cropSurface.classList.toggle('effects-on', event.target.checked));
document.querySelector('#applyCrop').addEventListener('click', () => { drawCrop(); const src = cropCanvas.toDataURL('image/png'); if (importMode === 'add') { const layer = makeLayer(cropState.fileName || 'Nouveau calque', src); layers.push(layer); selectedLayerId = layer.id; } else { selectedLayer().src = src; selectedLayer().name = cropState.fileName || selectedLayer().name; } closeCropDialog(); renderAll(); });
['closeCrop', 'cancelCrop'].forEach((id) => document.querySelector(`#${id}`).addEventListener('click', closeCropDialog)); cropDialog.addEventListener('cancel', (event) => { event.preventDefault(); closeCropDialog(); });

const inspectionDialog = document.querySelector('#inspectionDialog'); const inspectionStage = document.querySelector('#inspectionStage'); const inspectionCard = document.querySelector('#inspectionCard'); const detailLens = document.querySelector('#detailLens');
let magnifierEnabled = false; let magnification = 2; let lensCard = null;
function syncInspectionCard() {
  renderLayerStack(inspectionCard.querySelector('.content-layers'));
  ['finish-glitter', 'finish-grain', 'finish-scratches', 'no-spring'].forEach((name) => inspectionCard.classList.toggle(name, card.classList.contains(name)));
  ['--glare-opacity', '--glare-spread', '--foil-opacity', '--grid-opacity', '--grain-opacity'].forEach((property) => inspectionCard.style.setProperty(property, getComputedStyle(card).getPropertyValue(property)));
  const controls = document.querySelector('#inspectionLayers'); controls.replaceChildren(Object.assign(document.createElement('span'), { textContent: 'Calques' }));
  [...layers].reverse().forEach((layer) => { const button = document.createElement('button'); button.type = 'button'; button.className = layer.visible ? 'active' : ''; button.textContent = layer.name; button.addEventListener('click', () => { layer.visible = !layer.visible; syncInspectionCard(); renderAll(); }); controls.appendChild(button); });
}
function rebuildLensCard() { detailLens.replaceChildren(); lensCard = inspectionCard.cloneNode(true); lensCard.removeAttribute('id'); lensCard.classList.add('lens-card'); detailLens.appendChild(lensCard); }
function setMagnifier(enabled) { magnifierEnabled = enabled; document.querySelector('#toggleMagnifier').setAttribute('aria-pressed', String(enabled)); inspectionStage.classList.toggle('magnifier-active', enabled); detailLens.classList.remove('visible'); document.querySelector('#inspectionHint').textContent = enabled ? 'Survolez la carte pour grossir une zone.' : 'Déplacez le curseur pour observer les reflets.'; inspectionCard.style.setProperty('--rx', '0deg'); inspectionCard.style.setProperty('--ry', '0deg'); if (enabled) rebuildLensCard(); }
document.querySelector('#openInspection').addEventListener('click', () => { syncInspectionCard(); inspectionDialog.showModal(); requestAnimationFrame(() => setMagnifier(false)); }); document.querySelector('#closeInspection').addEventListener('click', () => { setMagnifier(false); inspectionDialog.close(); }); document.querySelector('#toggleMagnifier').addEventListener('click', () => setMagnifier(!magnifierEnabled));
document.querySelectorAll('[data-magnification]').forEach((button) => button.addEventListener('click', () => { magnification = Number(button.dataset.magnification); document.querySelectorAll('[data-magnification]').forEach((item) => item.classList.toggle('selected', item === button)); }));
inspectionStage.addEventListener('pointermove', (event) => {
  const bounds = inspectionCard.getBoundingClientRect(); const stageBounds = inspectionStage.getBoundingClientRect(); const x = (event.clientX - bounds.left) / bounds.width; const y = (event.clientY - bounds.top) / bounds.height;
  if (x < 0 || x > 1 || y < 0 || y > 1) { detailLens.classList.remove('visible'); return; }
  const px = `${x * 100}%`; const py = `${y * 100}%`; inspectionCard.style.setProperty('--x', px); inspectionCard.style.setProperty('--y', py);
  if (!magnifierEnabled) { inspectionCard.style.setProperty('--rx', `${(0.5 - y) * 16}deg`); inspectionCard.style.setProperty('--ry', `${(x - 0.5) * 16}deg`); return; }
  if (!lensCard) rebuildLensCard(); lensCard.style.setProperty('--x', px); lensCard.style.setProperty('--y', py);
  const left = Math.max(10, Math.min(stageBounds.width - detailLens.offsetWidth - 10, event.clientX - stageBounds.left + 24)); const top = Math.max(10, Math.min(stageBounds.height - detailLens.offsetHeight - 10, event.clientY - stageBounds.top - detailLens.offsetHeight / 2));
  detailLens.style.left = `${left}px`; detailLens.style.top = `${top}px`; lensCard.style.height = `${bounds.height}px`; lensCard.style.transform = `translate(${detailLens.offsetWidth / 2 - x * bounds.width * magnification}px, ${detailLens.offsetHeight / 2 - y * bounds.height * magnification}px) scale(${magnification})`; detailLens.classList.add('visible');
});
inspectionStage.addEventListener('pointerleave', () => { detailLens.classList.remove('visible'); inspectionCard.style.setProperty('--rx', '0deg'); inspectionCard.style.setProperty('--ry', '0deg'); }); inspectionDialog.addEventListener('cancel', (event) => { event.preventDefault(); setMagnifier(false); inspectionDialog.close(); });

setCardPosition(); updateLight(); updateMotion(); renderAll();
