const card = document.querySelector('#holoCard');
const stage = document.querySelector('#cardStage');
const ambientGlow = document.querySelector('.ambient-glow');
const defaults = { glarePower: 48, glareSpread: 36, rotationX: 14, rotationY: 18, perspective: 800 };
const motion = { rotationX: defaults.rotationX, rotationY: defaults.rotationY };

function setCardPosition(x = 0.5, y = 0.5) {
  const rotateY = (x - 0.5) * motion.rotationY * 2;
  const rotateX = (0.5 - y) * motion.rotationX * 2;
  card.style.setProperty('--x', `${x * 100}%`);
  card.style.setProperty('--y', `${y * 100}%`);
  card.style.setProperty('--rx', `${rotateX}deg`);
  card.style.setProperty('--ry', `${rotateY}deg`);
}

stage.addEventListener('pointermove', (event) => {
  const bounds = card.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
  const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
  card.classList.add('interacting');
  setCardPosition(x, y);
});

stage.addEventListener('pointerleave', () => {
  card.classList.remove('interacting');
  setCardPosition();
});

const layerElements = {
  image: card.querySelector('img'),
  grid: card.querySelector('.holo-grid'),
  foil: card.querySelector('.holo-rainbow'),
  glitter: card.querySelector('.holo-grain'),
  glare: card.querySelector('.card-glare')
};

document.querySelectorAll('.layer-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const visible = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(visible));
    button.classList.toggle('active', visible);
    layerElements[button.dataset.layer]?.classList.toggle('is-hidden', !visible);
  });
});

function updateLight() {
  const power = Number(document.querySelector('#glarePower').value);
  const spread = Number(document.querySelector('#glareSpread').value);
  card.style.setProperty('--glare-opacity', power / 100);
  card.style.setProperty('--glare-spread', `${spread}%`);
  document.querySelector('#glarePowerValue').textContent = `${power}%`;
  document.querySelector('#glareSpreadValue').textContent = `${spread}%`;
}

function updateMotion() {
  motion.rotationX = Number(document.querySelector('#rotationX').value);
  motion.rotationY = Number(document.querySelector('#rotationY').value);
  const perspective = Number(document.querySelector('#perspective').value);
  stage.style.perspective = `${perspective}px`;
  document.querySelector('#rotationXValue').textContent = `± ${motion.rotationX}°`;
  document.querySelector('#rotationYValue').textContent = `± ${motion.rotationY}°`;
  document.querySelector('#perspectiveValue').textContent = `${perspective} px`;
}

['glarePower', 'glareSpread'].forEach((id) => document.querySelector(`#${id}`).addEventListener('input', updateLight));
['rotationX', 'rotationY', 'perspective'].forEach((id) => document.querySelector(`#${id}`).addEventListener('input', updateMotion));

document.querySelector('#resetLight').addEventListener('click', () => {
  document.querySelector('#glarePower').value = defaults.glarePower;
  document.querySelector('#glareSpread').value = defaults.glareSpread;
  updateLight();
});

document.querySelector('#resetMotion').addEventListener('click', () => {
  document.querySelector('#rotationX').value = defaults.rotationX;
  document.querySelector('#rotationY').value = defaults.rotationY;
  document.querySelector('#perspective').value = defaults.perspective;
  updateMotion();
  setCardPosition();
});

document.querySelector('#springMotion').addEventListener('change', (event) => {
  card.classList.toggle('no-spring', !event.target.checked);
});

document.querySelectorAll('[data-finish]').forEach((checkbox) => {
  const applyFinish = () => {
    const enabled = checkbox.checked;
    if (checkbox.dataset.finish === 'halo') ambientGlow.classList.toggle('is-hidden', !enabled);
    else card.classList.toggle(`finish-${checkbox.dataset.finish}`, enabled);
  };
  checkbox.addEventListener('change', applyFinish);
  applyFinish();
});

document.querySelectorAll('input[type="range"]:not(#glarePower):not(#glareSpread):not(#rotationX):not(#rotationY):not(#perspective)').forEach((range) => {
  range.addEventListener('input', () => {
    const output = range.closest('.range-field')?.querySelector('output');
    if (output) output.textContent = `${range.value}%`;
  });
});

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((item) => item.classList.remove('active'));
    tab.classList.add('active');
    const section = document.querySelector(`[data-section="${tab.dataset.target}"]`);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

setCardPosition();
updateLight();
updateMotion();

const cardName = document.querySelector('#cardName');
const previewCardName = document.querySelector('#previewCardName');
const defaultImageSource = 'assets/paris-rooftop-contemplation-v3.png';
const cardImage = card.querySelector('img');
const imageInput = document.querySelector('#imageInput');
const cropDialog = document.querySelector('#cropDialog');
const cropCanvas = document.querySelector('#cropCanvas');
const cropContext = cropCanvas.getContext('2d');
const cropSurface = document.querySelector('#cropSurface');
const cropZoom = document.querySelector('#cropZoom');
const cropError = document.querySelector('#cropError');
const sourceName = document.querySelector('#sourceName');
const sourceMeta = document.querySelector('#sourceMeta');

cardName.addEventListener('input', () => {
  previewCardName.textContent = cardName.value.trim() || 'Carte sans titre';
});

const cropState = {
  image: null,
  fit: 'cover',
  zoom: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  dragging: false,
  pointerX: 0,
  pointerY: 0
};

function rotatedDimensions() {
  const quarterTurn = Math.abs(cropState.rotation / 90) % 2 === 1;
  return {
    width: quarterTurn ? cropState.image.height : cropState.image.width,
    height: quarterTurn ? cropState.image.width : cropState.image.height
  };
}

function baseCropScale() {
  const size = rotatedDimensions();
  const scaleX = cropCanvas.width / size.width;
  const scaleY = cropCanvas.height / size.height;
  return cropState.fit === 'contain' ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);
}

function drawCrop() {
  if (!cropState.image) return;
  cropContext.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
  cropContext.fillStyle = '#08090d';
  cropContext.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
  const scale = baseCropScale() * cropState.zoom;
  cropContext.save();
  cropContext.translate(cropCanvas.width / 2 + cropState.offsetX, cropCanvas.height / 2 + cropState.offsetY);
  cropContext.rotate(cropState.rotation * Math.PI / 180);
  cropContext.drawImage(
    cropState.image,
    -cropState.image.width * scale / 2,
    -cropState.image.height * scale / 2,
    cropState.image.width * scale,
    cropState.image.height * scale
  );
  cropContext.restore();
}

function resetCropState(fit = cropState.fit) {
  cropState.fit = fit;
  cropState.zoom = 1;
  cropState.rotation = 0;
  cropState.offsetX = 0;
  cropState.offsetY = 0;
  cropZoom.value = 100;
  document.querySelector('#cropZoomValue').textContent = '100%';
  document.querySelector('#fitContain').classList.toggle('selected', fit === 'contain');
  document.querySelector('#fitCover').classList.toggle('selected', fit === 'cover');
  drawCrop();
}

function closeCropDialog() {
  cropDialog.close();
  imageInput.value = '';
  cropState.image = null;
  cropError.textContent = '';
}

document.querySelector('#replaceImage').addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', () => {
  const file = imageInput.files?.[0];
  if (!file) return;
  cropError.textContent = '';
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    cropError.textContent = 'Format non compatible. Choisissez une image PNG, JPEG ou WEBP.';
    cropDialog.showModal();
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    cropError.textContent = 'Cette image dépasse la limite de 10 Mo.';
    cropDialog.showModal();
    return;
  }

  const temporaryUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(temporaryUrl);
    cropState.image = image;
    sourceName.textContent = file.name;
    const megabytes = (file.size / 1024 / 1024).toFixed(1);
    sourceMeta.textContent = `${image.naturalWidth} × ${image.naturalHeight} px · ${megabytes} Mo`;
    cropError.textContent = image.naturalWidth < 733 || image.naturalHeight < 1024
      ? 'Résolution limitée : le résultat pourra paraître légèrement flou.'
      : '';
    resetCropState('cover');
    cropSurface.classList.toggle('effects-on', document.querySelector('#previewEffects').checked);
    cropDialog.showModal();
  };
  image.onerror = () => {
    URL.revokeObjectURL(temporaryUrl);
    cropError.textContent = 'Cette image n’a pas pu être lue.';
    cropDialog.showModal();
  };
  image.src = temporaryUrl;
});

cropZoom.addEventListener('input', () => {
  cropState.zoom = Number(cropZoom.value) / 100;
  document.querySelector('#cropZoomValue').textContent = `${cropZoom.value}%`;
  drawCrop();
});

cropSurface.addEventListener('wheel', (event) => {
  event.preventDefault();
  const nextValue = Math.max(25, Math.min(300, Number(cropZoom.value) - Math.sign(event.deltaY) * 8));
  cropZoom.value = nextValue;
  cropZoom.dispatchEvent(new Event('input'));
}, { passive: false });

cropSurface.addEventListener('pointerdown', (event) => {
  if (!cropState.image) return;
  cropState.dragging = true;
  cropState.pointerX = event.clientX;
  cropState.pointerY = event.clientY;
  cropSurface.classList.add('dragging');
  cropSurface.setPointerCapture(event.pointerId);
});

cropSurface.addEventListener('pointermove', (event) => {
  if (!cropState.dragging) return;
  const scaleX = cropCanvas.width / cropSurface.clientWidth;
  const scaleY = cropCanvas.height / cropSurface.clientHeight;
  cropState.offsetX += (event.clientX - cropState.pointerX) * scaleX;
  cropState.offsetY += (event.clientY - cropState.pointerY) * scaleY;
  cropState.pointerX = event.clientX;
  cropState.pointerY = event.clientY;
  drawCrop();
});

function stopDragging() {
  cropState.dragging = false;
  cropSurface.classList.remove('dragging');
}

cropSurface.addEventListener('pointerup', stopDragging);
cropSurface.addEventListener('pointercancel', stopDragging);

document.querySelector('#fitContain').addEventListener('click', () => resetCropState('contain'));
document.querySelector('#fitCover').addEventListener('click', () => resetCropState('cover'));
document.querySelector('#resetCrop').addEventListener('click', () => resetCropState('cover'));

function rotateCrop(amount) {
  cropState.rotation = (cropState.rotation + amount + 360) % 360;
  cropState.offsetX = 0;
  cropState.offsetY = 0;
  drawCrop();
}

document.querySelector('#rotateLeft').addEventListener('click', () => rotateCrop(-90));
document.querySelector('#rotateRight').addEventListener('click', () => rotateCrop(90));
document.querySelector('#previewEffects').addEventListener('change', (event) => {
  cropSurface.classList.toggle('effects-on', event.target.checked);
});

document.querySelector('#applyCrop').addEventListener('click', () => {
  if (!cropState.image) return;
  drawCrop();
  cardImage.src = cropCanvas.toDataURL('image/png');
  cardImage.alt = `Carte personnalisée — ${sourceName.textContent}`;
  closeCropDialog();
});

document.querySelector('#restoreDefaultImage').addEventListener('click', () => {
  cardImage.src = defaultImageSource;
  cardImage.alt = 'Visuel de carte personnalisable';
});

document.querySelector('#closeCrop').addEventListener('click', closeCropDialog);
document.querySelector('#cancelCrop').addEventListener('click', closeCropDialog);
cropDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeCropDialog();
});

const inspectionDialog = document.querySelector('#inspectionDialog');
const inspectionStage = document.querySelector('#inspectionStage');
const inspectionCard = document.querySelector('#inspectionCard');
const inspectionImage = inspectionCard.querySelector('img');
const detailLens = document.querySelector('#detailLens');
const magnifierButton = document.querySelector('#toggleMagnifier');
const inspectionHint = document.querySelector('#inspectionHint');
let magnifierEnabled = false;
let magnification = 2;
let lensCard = null;

function inspectionLayerElement(layer) {
  const selectors = {
    image: 'img',
    grid: '.holo-grid',
    foil: '.holo-rainbow',
    glitter: '.holo-grain',
    glare: '.card-glare'
  };
  return inspectionCard.querySelector(selectors[layer]);
}

function syncInspectionLayerButtons() {
  document.querySelectorAll('[data-inspection-layer]').forEach((button) => {
    const layer = button.dataset.inspectionLayer;
    const element = inspectionLayerElement(layer);
    const visible = !element.classList.contains('is-hidden') && (layer !== 'glitter' || inspectionCard.classList.contains('finish-glitter'));
    button.classList.toggle('active', visible);
    button.setAttribute('aria-pressed', String(visible));
  });
}

function syncInspectionCard() {
  inspectionImage.src = cardImage.src;
  inspectionImage.alt = cardImage.alt;
  ['finish-glitter', 'finish-grain', 'finish-scratches', 'no-spring'].forEach((className) => {
    inspectionCard.classList.toggle(className, card.classList.contains(className));
  });

  const pairs = [
    ['img', 'img'],
    ['.holo-grid', '.holo-grid'],
    ['.holo-rainbow', '.holo-rainbow'],
    ['.holo-grain', '.holo-grain'],
    ['.card-glare', '.card-glare']
  ];
  pairs.forEach(([mainSelector, modalSelector]) => {
    const source = mainSelector === 'img' ? cardImage : card.querySelector(mainSelector);
    inspectionCard.querySelector(modalSelector).classList.toggle('is-hidden', source.classList.contains('is-hidden'));
  });

  const computedCard = getComputedStyle(card);
  ['--glare-opacity', '--glare-spread', '--foil-opacity', '--grid-opacity', '--grain-opacity'].forEach((property) => {
    inspectionCard.style.setProperty(property, computedCard.getPropertyValue(property));
  });
  syncInspectionLayerButtons();
}

function rebuildLensCard() {
  detailLens.replaceChildren();
  lensCard = inspectionCard.cloneNode(true);
  lensCard.removeAttribute('id');
  lensCard.removeAttribute('aria-label');
  lensCard.setAttribute('aria-hidden', 'true');
  lensCard.classList.add('lens-card');
  detailLens.appendChild(lensCard);
}

function setMagnifier(enabled) {
  magnifierEnabled = enabled;
  magnifierButton.setAttribute('aria-pressed', String(enabled));
  inspectionStage.classList.toggle('magnifier-active', enabled);
  detailLens.classList.remove('visible');
  detailLens.setAttribute('aria-hidden', String(!enabled));
  inspectionHint.textContent = enabled
    ? 'Survolez la carte pour grossir une zone. Le mouvement 3D est temporairement figé.'
    : 'Déplacez le curseur pour observer les reflets.';
  inspectionCard.style.setProperty('--rx', '0deg');
  inspectionCard.style.setProperty('--ry', '0deg');
  if (enabled) rebuildLensCard();
}

function openInspection() {
  syncInspectionCard();
  inspectionDialog.showModal();
  requestAnimationFrame(() => {
    setMagnifier(false);
    inspectionCard.style.setProperty('--x', '50%');
    inspectionCard.style.setProperty('--y', '50%');
  });
}

function closeInspection() {
  setMagnifier(false);
  inspectionDialog.close();
}

document.querySelector('#openInspection').addEventListener('click', openInspection);
document.querySelector('#closeInspection').addEventListener('click', closeInspection);
magnifierButton.addEventListener('click', () => setMagnifier(!magnifierEnabled));

document.querySelectorAll('[data-inspection-layer]').forEach((button) => {
  button.addEventListener('click', () => {
    const layer = button.dataset.inspectionLayer;
    const visible = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(visible));
    button.classList.toggle('active', visible);
    inspectionLayerElement(layer).classList.toggle('is-hidden', !visible);
    if (layer === 'glitter') inspectionCard.classList.toggle('finish-glitter', visible);
    if (magnifierEnabled) rebuildLensCard();
  });
});

document.querySelectorAll('[data-magnification]').forEach((button) => {
  button.addEventListener('click', () => {
    magnification = Number(button.dataset.magnification);
    document.querySelectorAll('[data-magnification]').forEach((item) => item.classList.toggle('selected', item === button));
  });
});

inspectionStage.addEventListener('pointermove', (event) => {
  const cardBounds = inspectionCard.getBoundingClientRect();
  const stageBounds = inspectionStage.getBoundingClientRect();
  const x = (event.clientX - cardBounds.left) / cardBounds.width;
  const y = (event.clientY - cardBounds.top) / cardBounds.height;
  const insideCard = x >= 0 && x <= 1 && y >= 0 && y <= 1;

  if (!insideCard) {
    detailLens.classList.remove('visible');
    if (!magnifierEnabled) {
      inspectionCard.style.setProperty('--rx', '0deg');
      inspectionCard.style.setProperty('--ry', '0deg');
    }
    return;
  }

  const pointerX = `${x * 100}%`;
  const pointerY = `${y * 100}%`;
  inspectionCard.style.setProperty('--x', pointerX);
  inspectionCard.style.setProperty('--y', pointerY);

  if (!magnifierEnabled) {
    inspectionCard.style.setProperty('--rx', `${(0.5 - y) * 16}deg`);
    inspectionCard.style.setProperty('--ry', `${(x - 0.5) * 16}deg`);
    return;
  }

  if (!lensCard) rebuildLensCard();
  lensCard.style.setProperty('--x', pointerX);
  lensCard.style.setProperty('--y', pointerY);
  const lensWidth = detailLens.offsetWidth;
  const lensHeight = detailLens.offsetHeight;
  const desiredLeft = event.clientX - stageBounds.left + 24;
  const desiredTop = event.clientY - stageBounds.top - lensHeight / 2;
  const left = Math.max(10, Math.min(stageBounds.width - lensWidth - 10, desiredLeft));
  const top = Math.max(10, Math.min(stageBounds.height - lensHeight - 10, desiredTop));
  detailLens.style.left = `${left}px`;
  detailLens.style.top = `${top}px`;
  lensCard.style.height = `${cardBounds.height}px`;
  lensCard.style.transform = `translate(${lensWidth / 2 - x * cardBounds.width * magnification}px, ${lensHeight / 2 - y * cardBounds.height * magnification}px) scale(${magnification})`;
  detailLens.classList.add('visible');
});

inspectionStage.addEventListener('pointerleave', () => {
  detailLens.classList.remove('visible');
  inspectionCard.style.setProperty('--rx', '0deg');
  inspectionCard.style.setProperty('--ry', '0deg');
});

inspectionDialog.addEventListener('click', (event) => {
  if (event.target === inspectionDialog) closeInspection();
});

inspectionDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeInspection();
});
