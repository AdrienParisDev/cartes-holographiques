import { renderLayerStack } from '../rendering/layer-renderer.js?v=effect-preview-2';

export function initInspection(store, renderAll) {
  const sourceCard = document.querySelector('#holoCard');
  const dialog = document.querySelector('#inspectionDialog');
  const stage = document.querySelector('#inspectionStage');
  const card = document.querySelector('#inspectionCard');
  const lens = document.querySelector('#detailLens');
  let magnifierEnabled = false;
  let magnification = 2;
  let lensCard = null;

  function syncCard() {
    renderLayerStack(store.layers, card.querySelector('.content-layers'), store.production);
    ['finish-glitter', 'finish-grain', 'finish-scratches', 'no-spring'].forEach((name) => {
      card.classList.toggle(name, sourceCard.classList.contains(name));
    });
    ['--glare-opacity', '--glare-brightness', '--glare-spread', '--glare-core-size', '--glare-core-opacity', '--holo-response-opacity', '--glare-blend-mode', '--foil-opacity', '--grid-opacity', '--grain-opacity', '--halo-edge-opacity', '--halo-edge-spread'].forEach((property) => {
      card.style.setProperty(property, getComputedStyle(sourceCard).getPropertyValue(property));
    });
    const controls = document.querySelector('#inspectionLayers');
    controls.replaceChildren(Object.assign(document.createElement('span'), { textContent: 'Calques' }));
    [...store.layers].reverse().forEach((layer) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = layer.visible ? 'active' : '';
      button.textContent = layer.name;
      button.addEventListener('click', () => {
        layer.visible = !layer.visible;
        syncCard();
        renderAll();
      });
      controls.appendChild(button);
    });
  }

  function rebuildLens() {
    lens.replaceChildren();
    lensCard = card.cloneNode(true);
    lensCard.removeAttribute('id');
    lensCard.classList.add('lens-card');
    lens.appendChild(lensCard);
  }

  function setMagnifier(enabled) {
    magnifierEnabled = enabled;
    document.querySelector('#toggleMagnifier').setAttribute('aria-pressed', String(enabled));
    stage.classList.toggle('magnifier-active', enabled);
    lens.classList.remove('visible');
    document.querySelector('#inspectionHint').textContent = enabled
      ? 'Survolez la carte pour grossir une zone.'
      : 'Déplacez le curseur pour observer les reflets.';
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    if (enabled) rebuildLens();
  }

  document.querySelector('#openInspection').addEventListener('click', () => {
    syncCard();
    dialog.showModal();
    requestAnimationFrame(() => setMagnifier(false));
  });
  document.querySelector('#closeInspection').addEventListener('click', () => {
    setMagnifier(false);
    dialog.close();
  });
  document.querySelector('#toggleMagnifier').addEventListener('click', () => {
    setMagnifier(!magnifierEnabled);
  });
  document.querySelectorAll('[data-magnification]').forEach((button) => {
    button.addEventListener('click', () => {
      magnification = Number(button.dataset.magnification);
      document.querySelectorAll('[data-magnification]').forEach((item) => {
        item.classList.toggle('selected', item === button);
      });
    });
  });
  stage.addEventListener('pointermove', (event) => {
    const bounds = card.getBoundingClientRect();
    const stageBounds = stage.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) {
      lens.classList.remove('visible');
      return;
    }
    const px = `${x * 100}%`;
    const py = `${y * 100}%`;
    card.style.setProperty('--x', px);
    card.style.setProperty('--y', py);
    const lightAngle = Math.atan2(y - 0.5, x - 0.5) * 180 / Math.PI;    card.style.setProperty('--light-angle', `${lightAngle}deg`);    card.style.setProperty('--tilt-x', String((0.5 - y) * 2));    card.style.setProperty('--tilt-y', String((x - 0.5) * 2));
    if (!magnifierEnabled) {
      card.style.setProperty('--rx', `${(0.5 - y) * 16}deg`);
      card.style.setProperty('--ry', `${(x - 0.5) * 16}deg`);
      return;
    }
    if (!lensCard) rebuildLens();
    lensCard.style.setProperty('--x', px);
    lensCard.style.setProperty('--y', py);
    const left = Math.max(10, Math.min(stageBounds.width - lens.offsetWidth - 10, event.clientX - stageBounds.left + 24));
    const top = Math.max(10, Math.min(stageBounds.height - lens.offsetHeight - 10, event.clientY - stageBounds.top - lens.offsetHeight / 2));
    lens.style.left = `${left}px`;
    lens.style.top = `${top}px`;
    lensCard.style.height = `${bounds.height}px`;
    lensCard.style.transform = `translate(${lens.offsetWidth / 2 - x * bounds.width * magnification}px, ${lens.offsetHeight / 2 - y * bounds.height * magnification}px) scale(${magnification})`;
    lens.classList.add('visible');
  });
  stage.addEventListener('pointerleave', () => {
    lens.classList.remove('visible');
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    setMagnifier(false);
    dialog.close();
  });
}
