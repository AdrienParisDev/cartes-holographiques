import { createLayer } from '../models/layer.js?v=effect-preview-2';
import { renderLayerStack } from '../rendering/layer-renderer.js';
import { maskUrl } from '../utils/dom.js';

export function initImageCropper(store, renderAll) {
  const imageInput = document.querySelector('#imageInput');
  const dialog = document.querySelector('#cropDialog');
  const canvas = document.querySelector('#cropCanvas');
  const context = canvas.getContext('2d');
  const surface = document.querySelector('#cropSurface');
  const showOtherLayers = document.querySelector('#showOtherLayers');
  const contextUnder = document.querySelector('#cropContextUnder');
  const contextOver = document.querySelector('#cropContextOver');
  const effectsPreview = document.querySelector('#cropEffectsPreview');
  const effectsLayers = document.querySelector('#cropEffectsLayers');
  const sourceThumbnail = document.querySelector('#sourceThumbnail');
  const zoomInput = document.querySelector('#cropZoom');
  const rotationInput = document.querySelector('#cropRotation');
  const rotationNumber = document.querySelector('#cropRotationNumber');
  const previewEffects = document.querySelector('#previewEffects');
  const error = document.querySelector('#cropError');
  let activeEffectLayer = null;
  let effectUpdateTimer = null;
  const state = {
    image: null, fit: 'cover', zoom: 1, rotation: 0,
    offsetX: 0, offsetY: 0, dragging: false,
    pointerX: 0, pointerY: 0, fileName: '', importMode: 'replace'
  };

  function renderContextLayers() {
    contextUnder.replaceChildren();
    contextOver.replaceChildren();
    if (!showOtherLayers.checked) return;
    const selectedIndex = state.importMode === 'add'
      ? store.layers.length
      : store.layers.findIndex((layer) => layer.id === store.selectedLayerId);
    store.layers.forEach((layer, index) => {
      if (!layer.visible || index === selectedIndex) return;
      const image = document.createElement('img');
      image.src = layer.src;
      image.alt = '';
      image.draggable = false;
      (index < selectedIndex ? contextUnder : contextOver).appendChild(image);
    });
  }

  function rotatedDimensions() {
    const radians = state.rotation * Math.PI / 180;
    const cosine = Math.abs(Math.cos(radians));
    const sine = Math.abs(Math.sin(radians));
    return {
      width: state.image.width * cosine + state.image.height * sine,
      height: state.image.width * sine + state.image.height * cosine,
      coverWidth: (canvas.width * cosine + canvas.height * sine) / state.image.width,
      coverHeight: (canvas.width * sine + canvas.height * cosine) / state.image.height
    };
  }

  function baseScale() {
    const size = rotatedDimensions();
    return state.fit === 'contain'
      ? Math.min(canvas.width / size.width, canvas.height / size.height)
      : Math.max(size.coverWidth, size.coverHeight);
  }

  function syncEffectsPreview() {
    effectUpdateTimer = null;
    if (!dialog.open || !previewEffects.checked || !activeEffectLayer) return;
    const src = canvas.toDataURL('image/png');
    activeEffectLayer.querySelector('img').src = src;
    activeEffectLayer.style.setProperty('--layer-mask', maskUrl(src));
  }

  function scheduleEffectsPreview() {
    if (!dialog.open || !previewEffects.checked || effectUpdateTimer !== null) return;
    effectUpdateTimer = window.setTimeout(syncEffectsPreview, 70);
  }

  function renderEffectsPreview() {
    activeEffectLayer = null;
    effectsLayers.replaceChildren();
    if (!state.image || !previewEffects.checked) return;
    const selectedIndex = state.importMode === 'add'
      ? store.layers.length
      : store.layers.findIndex((layer) => layer.id === store.selectedLayerId);
    const editedLayer = state.importMode === 'add'
      ? createLayer(state.fileName || 'Nouveau calque', canvas.toDataURL('image/png'))
      : { ...store.layers[selectedIndex], src: canvas.toDataURL('image/png') };
    const layers = state.importMode === 'add'
      ? [...store.layers, editedLayer]
      : store.layers.map((layer, index) => index === selectedIndex ? editedLayer : layer);
    const visibleLayers = showOtherLayers.checked ? layers : layers.map((layer) => layer === editedLayer ? layer : { ...layer, visible: false });
    renderLayerStack(visibleLayers, effectsLayers, store.production);
    activeEffectLayer = [...effectsLayers.children][selectedIndex];

    const sourceCard = document.querySelector('#holoCard');
    const sourceSupport = document.querySelector('#cardSurface > .support-surface');
    const targetSupport = effectsPreview.querySelector('.support-surface');
    targetSupport.style.cssText = sourceSupport?.style.cssText || '';
    effectsPreview.dataset.substrate = sourceCard.dataset.substrate;
    const sourceStyle = getComputedStyle(sourceCard);
    for (const property of ['--substrate-tint', '--substrate-reflectivity', '--substrate-roughness', '--glare-opacity', '--glare-brightness', '--glare-spread', '--glare-core-size', '--glare-core-opacity', '--holo-response-opacity', '--glare-blend-mode', '--halo-edge-opacity', '--halo-edge-spread']) {
      effectsPreview.style.setProperty(property, sourceStyle.getPropertyValue(property));
    }
    effectsPreview.style.setProperty('--x', '50%');
    effectsPreview.style.setProperty('--y', '50%');
    effectsPreview.classList.toggle('finish-glitter', sourceCard.classList.contains('finish-glitter'));
    effectsPreview.classList.toggle('finish-grain', sourceCard.classList.contains('finish-grain'));
    effectsPreview.classList.toggle('finish-scratches', sourceCard.classList.contains('finish-scratches'));
  }

  function draw() {
    if (!state.image) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const scale = baseScale() * state.zoom;
    context.save();
    context.translate(canvas.width / 2 + state.offsetX, canvas.height / 2 + state.offsetY);
    context.rotate(state.rotation * Math.PI / 180);
    context.drawImage(
      state.image,
      -state.image.width * scale / 2,
      -state.image.height * scale / 2,
      state.image.width * scale,
      state.image.height * scale
    );
    context.restore();
    scheduleEffectsPreview();
  }

  function reset(fit = state.fit) {
    Object.assign(state, { fit, zoom: 1, rotation: 0, offsetX: 0, offsetY: 0 });
    zoomInput.value = 100;
    document.querySelector('#cropZoomValue').textContent = '100%';
    rotationInput.value = 0;
    rotationNumber.value = 0;
    document.querySelector('#fitContain').classList.toggle('selected', fit === 'contain');
    document.querySelector('#fitCover').classList.toggle('selected', fit === 'cover');
    draw();
  }

  function setFit(fit) {
    state.fit = fit;
    state.zoom = 1;
    state.offsetX = state.offsetY = 0;
    zoomInput.value = 100;
    document.querySelector('#cropZoomValue').textContent = '100%';
    document.querySelector('#fitContain').classList.toggle('selected', fit === 'contain');
    document.querySelector('#fitCover').classList.toggle('selected', fit === 'cover');
    draw();
  }

  function setRotation(angle) {
    const value = Number.isFinite(angle) ? Math.max(-180, Math.min(180, Math.round(angle))) : state.rotation;
    state.rotation = value;
    rotationInput.value = value;
    rotationNumber.value = value;
    draw();
  }

  function rotateQuarterTurn(direction) {
    const nearestQuarterTurn = Math.round(state.rotation / 90) * 90;
    let angle = nearestQuarterTurn + direction * 90;
    if (angle > 180) angle -= 360;
    if (angle < -180) angle += 360;
    setRotation(angle);
  }

  function close() {
    if (effectUpdateTimer !== null) window.clearTimeout(effectUpdateTimer);
    effectUpdateTimer = null;
    activeEffectLayer = null;
    effectsLayers.replaceChildren();
    sourceThumbnail.removeAttribute('src');
    dialog.close();
    imageInput.value = '';
    state.image = null;
    error.textContent = '';
  }

  function showImage(image, name, meta, message = '') {
    state.image = image;
    state.fileName = name;
    document.querySelector('#sourceName').textContent = name;
    document.querySelector('#sourceMeta').textContent = meta;
    error.textContent = message;
    reset('cover');
    sourceThumbnail.src = canvas.toDataURL('image/png');
    sourceThumbnail.alt = `Aperçu de ${name}`;
    showOtherLayers.disabled = store.layers.filter((layer) => layer.visible && (state.importMode === 'add' || layer.id !== store.selectedLayerId)).length === 0;
    renderContextLayers();
    surface.classList.toggle('effects-on', previewEffects.checked);
    dialog.showModal();
    renderEffectsPreview();
  }

  function openExistingLayer(layer) {
    const image = new Image();
    image.onload = () => {
      store.selectLayer(layer.id);
      state.importMode = 'replace';
      showImage(
        image,
        layer.name,
        `${image.naturalWidth} × ${image.naturalHeight} px · image actuelle`,
        'Le recadrage repart de l’image actuellement utilisée par ce calque.'
      );
    };
    image.onerror = () => {
      error.textContent = 'Cette image n’a pas pu être rouverte.';
      dialog.showModal();
    };
    image.src = layer.src;
  }

  function requestImport(mode, layerId = null) {
    state.importMode = mode;
    if (layerId) store.selectLayer(layerId);
    imageInput.click();
  }

  imageInput.addEventListener('change', () => {
    const file = imageInput.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      error.textContent = 'Utilisez une image PNG, JPEG ou WebP de moins de 10 Mo.';
      dialog.showModal();
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      showImage(
        image,
        file.name.replace(/\.[^.]+$/, ''),
        `${image.naturalWidth} × ${image.naturalHeight} px · ${(file.size / 1048576).toFixed(1)} Mo`,
        file.type !== 'image/png' ? 'Sans transparence, les effets couvriront tout le rectangle du calque.' : ''
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      error.textContent = 'Cette image n’a pas pu être lue.';
      dialog.showModal();
    };
    image.src = url;
  });

  zoomInput.addEventListener('input', () => {
    state.zoom = Number(zoomInput.value) / 100;
    document.querySelector('#cropZoomValue').textContent = `${zoomInput.value}%`;
    draw();
  });
  surface.addEventListener('wheel', (event) => {
    event.preventDefault();
    zoomInput.value = Math.max(25, Math.min(300, Number(zoomInput.value) - Math.sign(event.deltaY) * 8));
    zoomInput.dispatchEvent(new Event('input'));
  }, { passive: false });
  surface.addEventListener('pointerdown', (event) => {
    if (!state.image) return;
    Object.assign(state, { dragging: true, pointerX: event.clientX, pointerY: event.clientY });
    surface.classList.add('dragging');
    surface.setPointerCapture(event.pointerId);
  });
  surface.addEventListener('pointermove', (event) => {
    if (!state.dragging) return;
    state.offsetX += (event.clientX - state.pointerX) * canvas.width / surface.clientWidth;
    state.offsetY += (event.clientY - state.pointerY) * canvas.height / surface.clientHeight;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    draw();
  });
  const stopDragging = () => {
    state.dragging = false;
    surface.classList.remove('dragging');
  };
  surface.addEventListener('pointerup', stopDragging);
  surface.addEventListener('pointercancel', stopDragging);
  document.querySelector('#fitContain').addEventListener('click', () => setFit('contain'));
  document.querySelector('#fitCover').addEventListener('click', () => setFit('cover'));
  document.querySelector('#resetCrop').addEventListener('click', () => reset('cover'));
  rotationInput.addEventListener('input', () => setRotation(Number(rotationInput.value)));
  rotationNumber.addEventListener('input', () => {
    if (rotationNumber.value !== '') setRotation(Number(rotationNumber.value));
  });
  rotationNumber.addEventListener('change', () => setRotation(Number(rotationNumber.value)));
  document.querySelector('#rotateLeft').addEventListener('click', () => rotateQuarterTurn(-1));
  document.querySelector('#rotateRight').addEventListener('click', () => rotateQuarterTurn(1));
  previewEffects.addEventListener('change', (event) => {
    surface.classList.toggle('effects-on', event.target.checked);
    renderEffectsPreview();
  });
  showOtherLayers.addEventListener('change', () => { renderContextLayers(); renderEffectsPreview(); });
  document.querySelector('#applyCrop').addEventListener('click', () => {
    draw();
    const src = canvas.toDataURL('image/png');
    if (state.importMode === 'add') {
      store.addLayer(createLayer(state.fileName || 'Nouveau calque', src));
    } else {
      store.selectedLayer.src = src;
      store.selectedLayer.name = state.fileName || store.selectedLayer.name;
    }
    close();
    renderAll();
  });
  ['closeCrop', 'cancelCrop'].forEach((id) => {
    document.querySelector(`#${id}`).addEventListener('click', close);
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  document.querySelector('#addLayer').addEventListener('click', () => requestImport('add'));

  return { openExistingLayer, requestImport };
}
