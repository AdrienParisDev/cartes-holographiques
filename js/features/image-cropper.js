import { createLayer } from '../models/layer.js?v=effect-preview-2';

export function initImageCropper(store, renderAll) {
  const imageInput = document.querySelector('#imageInput');
  const dialog = document.querySelector('#cropDialog');
  const canvas = document.querySelector('#cropCanvas');
  const context = canvas.getContext('2d');
  const surface = document.querySelector('#cropSurface');
  const zoomInput = document.querySelector('#cropZoom');
  const error = document.querySelector('#cropError');
  const state = {
    image: null, fit: 'cover', zoom: 1, rotation: 0,
    offsetX: 0, offsetY: 0, dragging: false,
    pointerX: 0, pointerY: 0, fileName: '', importMode: 'replace'
  };

  function rotatedDimensions() {
    const quarterTurn = Math.abs(state.rotation / 90) % 2 === 1;
    return {
      width: quarterTurn ? state.image.height : state.image.width,
      height: quarterTurn ? state.image.width : state.image.height
    };
  }

  function baseScale() {
    const size = rotatedDimensions();
    const scales = [canvas.width / size.width, canvas.height / size.height];
    return state.fit === 'contain' ? Math.min(...scales) : Math.max(...scales);
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
  }

  function reset(fit = state.fit) {
    Object.assign(state, { fit, zoom: 1, rotation: 0, offsetX: 0, offsetY: 0 });
    zoomInput.value = 100;
    document.querySelector('#cropZoomValue').textContent = '100%';
    document.querySelector('#fitContain').classList.toggle('selected', fit === 'contain');
    document.querySelector('#fitCover').classList.toggle('selected', fit === 'cover');
    draw();
  }

  function close() {
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
    surface.classList.toggle('effects-on', document.querySelector('#previewEffects').checked);
    dialog.showModal();
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
  document.querySelector('#fitContain').addEventListener('click', () => reset('contain'));
  document.querySelector('#fitCover').addEventListener('click', () => reset('cover'));
  document.querySelector('#resetCrop').addEventListener('click', () => reset('cover'));
  document.querySelector('#rotateLeft').addEventListener('click', () => {
    state.rotation = (state.rotation + 270) % 360;
    state.offsetX = state.offsetY = 0;
    draw();
  });
  document.querySelector('#rotateRight').addEventListener('click', () => {
    state.rotation = (state.rotation + 90) % 360;
    state.offsetX = state.offsetY = 0;
    draw();
  });
  document.querySelector('#previewEffects').addEventListener('change', (event) => {
    surface.classList.toggle('effects-on', event.target.checked);
  });
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
