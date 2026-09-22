import { createLayer } from '../models/layer.js';
import { createTexture } from '../models/texture.js';
import { createMaterialBackground } from '../rendering/material-renderer.js';
import { renderLayerStack } from '../rendering/layer-renderer.js';

function createExampleLayers(example) {
  return example.layers.map((item) => {
    const layer = createLayer(item.name, item.src, {}, item.style || {});
    Object.assign(layer.supportInteraction, item.supportInteraction || {});
    layer.textures = (item.textures || []).map((setting) => {
      const texture = createTexture(setting.type, layer.style, {
        holographic: setting.holographic !== false,
        animated: setting.animation?.enabled
      });
      Object.assign(texture.geometry, setting.geometry || {});
      Object.assign(texture.digitalAnimation, setting.animation || {});
      texture.propagateDown = Boolean(setting.propagateDown);
      if (texture.holographicTreatment) {
        Object.assign(texture.holographicTreatment, setting.treatment || {});
      }
      return texture;
    });
    return layer;
  });
}

function imageAvailable(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = src;
  });
}

function previewFor(example, layers, production, ready) {
  const visual = document.createElement('div');
  visual.className = `example-visual${ready ? '' : ' is-pending'}`;
  visual.setAttribute('aria-label', ready ? `Aperçu de ${example.title}` : `Images de ${example.title} en attente`);
  if (!ready) {
    visual.textContent = 'Aperçu disponible après ajout des images';
    return visual;
  }
  const support = document.createElement('div');
  support.className = 'support-surface';
  visual.style.setProperty('--example-support-opacity', String(production.support.intensity / 100));
  visual.style.setProperty('--example-support-image', createMaterialBackground(production.support, production.support.angle));
  visual.style.setProperty('--example-support-blend', production.support.blendMode);
  const content = document.createElement('div');
  content.className = 'content-layers';
  renderLayerStack(layers, content, production);
  const glare = document.createElement('div');
  glare.className = 'card-glare';
  visual.append(support, content, glare);
  return visual;
}

export async function initCardExamples(store, renderAll, productionSettings) {
  const track = document.querySelector('#examplesTrack');
  const status = document.querySelector('#examplesStatus');
  const previous = document.querySelector('#examplesPrevious');
  const next = document.querySelector('#examplesNext');

  function updateNavigation() {
    previous.disabled = track.scrollLeft < 5;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;
  }

  previous.addEventListener('click', () => track.scrollBy({ left: -500, behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: 500, behavior: 'smooth' }));
  track.addEventListener('scroll', updateNavigation, { passive: true });
  window.addEventListener('resize', updateNavigation);

  try {
    const response = await fetch('data/card-examples.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { cards } = await response.json();

    for (const example of cards) {
      const missing = (await Promise.all(example.layers.map(async (layer) =>
        (await imageAvailable(layer.src)) ? null : layer.src.split('/').at(-1)
      ))).filter(Boolean);
      const ready = missing.length === 0;
      const layers = createExampleLayers(example);
      const production = {
        ...store.production,
        support: { ...store.production.support, ...example.production.support }
      };
      const card = document.createElement('article');
      card.className = 'example-card';
      card.appendChild(previewFor(example, layers, production, ready));

      const copy = document.createElement('div');
      copy.className = 'example-copy';
      const title = document.createElement('h3');
      title.textContent = example.title;
      const description = document.createElement('p');
      description.textContent = example.description;
      const tags = document.createElement('div');
      tags.className = 'example-tags';
      (example.highlights || []).forEach((highlight) => {
        const tag = document.createElement('span');
        tag.textContent = highlight;
        tags.appendChild(tag);
      });
      const load = document.createElement('button');
      load.type = 'button';
      load.className = 'example-load';
      load.textContent = ready ? 'Charger dans l’éditeur →' : 'Images en attente';
      load.disabled = !ready;
      load.addEventListener('click', () => {
        // Rebuild the layers so editing an example never changes its source data or thumbnail.
        const freshLayers = createExampleLayers(example);
        store.replaceLayers(freshLayers);
        store.selectLayer(freshLayers.at(-1).id);
        Object.assign(store.production, example.production);
        Object.assign(store.production.support, example.production.support);
        document.querySelector('[data-output-mode="digital"]').click();
        for (const key of ['supportMaterial', 'supportPalette', 'supportIntensity', 'supportBlendMode', 'supportAngle']) {
          const control = document.querySelector(`#${key}`);
          control.value = store.production.support[{
            supportMaterial: 'material', supportPalette: 'palette', supportIntensity: 'intensity',
            supportBlendMode: 'blendMode', supportAngle: 'angle'
          }[key]];
        }
        productionSettings.render();
        for (const [key, value] of Object.entries(example.interaction || {})) {
          if (key === 'glareBlendMode') {
            const radio = document.querySelector(`[name="glareBlendMode"][value="${value}"]`);
            if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); }
          } else {
            const control = document.querySelector(`#${key}`);
            if (!control) continue;
            if (control.type === 'checkbox') control.checked = Boolean(value);
            else control.value = value;
            control.dispatchEvent(new Event(control.type === 'checkbox' ? 'change' : 'input', { bubbles: true }));
          }
        }
        const name = document.querySelector('#cardName');
        name.value = example.name || '';
        name.dispatchEvent(new Event('input', { bubbles: true }));
        renderAll();
        document.querySelector('#cardStage').scrollIntoView({ behavior: 'smooth', block: 'center' });
        status.textContent = `« ${example.title} » est chargé dans l’éditeur. Vous pouvez modifier cette copie librement.`;
      });
      copy.append(title, description, tags, load);
      if (!ready) {
        const note = document.createElement('small');
        note.className = 'example-missing';
        note.textContent = `À placer dans assets/card-examples/ : ${missing.join(', ')}.`;
        copy.appendChild(note);
      }
      card.appendChild(copy);
      track.appendChild(card);
    }
    updateNavigation();
  } catch (error) {
    status.textContent = 'Impossible de charger les cartes exemples. Vérifiez data/card-examples.json.';
    console.error('Catalogue des cartes exemples :', error);
  }
}
