import { createHolographicTreatment } from '../models/holographic-treatment.js';
import { createTexture } from '../models/texture.js';
import { textureCatalog } from '../models/textures/texture-catalog.js';
import { buildLayerElement } from '../rendering/layer-renderer.js?v=effect-preview-2';

const paletteOptions = `
  <option value="prism">Prisme</option>
  <option value="aurora">Aurore</option>
  <option value="solar">Solaire</option>
  <option value="ice">Glace</option>`;

const responseProfiles = {
  crosshatch: {
    title: 'Diffraction directionnelle',
    description: 'Les deux directions de lignes réagissent différemment à la lumière',
    controls: [
      ['dispersion', 'Dispersion chromatique', 75, 100],
      ['highlightWidth', 'Largeur du reflet', 40, 100],
      ['directionContrast', 'Contraste des directions', 60, 100],
      ['lightResponse', 'Sensibilité à l’inclinaison', 100, 150]
    ]
  },
  sparkle: {
    title: 'Réponse irisée',
    description: 'Les points restent fixes et réagissent à l’inclinaison',
    controls: [
      ['colorShift', 'Variation chromatique', 80, 100],
      ['highlightSharpness', 'Netteté des éclats', 65, 100],
      ['lightResponse', 'Sensibilité à l’inclinaison', 100, 150]
    ]
  },
  zigzag: {
    title: 'Réponse des arêtes',
    description: 'Les deux versants s’illuminent en alternance',
    controls: [
      ['faceAlternation', 'Alternance des faces', 75, 100],
      ['edgeHighlight', 'Intensité des arêtes', 55, 100],
      ['directionality', 'Sensibilité directionnelle', 90, 150],
      ['dispersion', 'Dispersion chromatique', 65, 100]
    ]
  },
  facets: {
    title: 'Réponse multifacette',
    description: 'Chaque famille de facettes possède une orientation lumineuse',
    controls: [
      ['facetContrast', 'Contraste des facettes', 70, 100],
      ['apparentDepth', 'Profondeur apparente', 45, 100],
      ['colorVariation', 'Variation chromatique', 75, 100],
      ['highlightSharpness', 'Netteté des reflets', 60, 100],
      ['lightResponse', 'Sensibilité à l’inclinaison', 100, 150]
    ]
  }
};

function rangeMarkup([property, label, value, max]) {
  return `<label class="mini-range"><span>${label} <output class="response-output" data-property="${property}">${value}%</output></span><input class="response-input" data-property="${property}" type="range" min="0" max="${max}" value="${value}"></label>`;
}

function treatmentMarkup(type) {
  const profile = responseProfiles[type];
  return `
    <div class="texture-property-block texture-optical-response response-${type}">
      <label class="texture-property-toggle"><span><b>${profile.title}</b><small>${profile.description}</small></span><span class="switch"><input class="texture-holo-toggle" type="checkbox"><span></span></span></label>
      <div class="texture-property-settings texture-holo-settings optical-response-settings" hidden>
        <label>Palette spectrale<select class="response-palette">${paletteOptions}</select></label>
        <label class="mini-range"><span>Intensité <output class="texture-intensity-output">54%</output></span><input class="texture-intensity" type="range" min="0" max="100" value="54"></label>
        ${profile.controls.map(rangeMarkup).join('')}
      </div>
    </div>
    <div class="texture-property-block digital-only">
      <label class="texture-property-toggle"><span><b>Animation web</b><small>Animation autonome, indépendante du mouvement</small></span><span class="switch"><input class="texture-animation-toggle" type="checkbox"><span></span></span></label>
      <div class="texture-property-settings texture-animation-settings" hidden>
        <label>Comportement<select class="texture-animation-mode"><option value="shimmer">Scintillement</option><option value="drift">Glissement</option><option value="pulse">Pulsation</option></select></label>
        <label class="mini-range"><span>Vitesse <output class="texture-speed-output">1×</output></span><input class="texture-speed" type="range" min="0.25" max="3" step="0.25" value="1"></label>
      </div>
    </div>`;
}

function createTreatment(type, style) {
  const defaults = textureCatalog[type]?.treatmentDefaults || {};
  return createHolographicTreatment(style, 'texture', defaults);
}

export function initTextureEditor(store, renderAll) {
  const dialog = document.querySelector('#patternDialog');
  const preview = document.querySelector('#patternPreview');
  const draft = { layerId: null, textures: {}, previewMode: 'selected' };

  document.querySelectorAll('.pattern-choice').forEach((choice) => {
    choice.querySelector('.pattern-choice-controls').insertAdjacentHTML(
      'beforeend',
      treatmentMarkup(choice.dataset.pattern)
    );
  });

  function renderPreview() {
    const layer = store.layers.find((entry) => entry.id === draft.layerId);
    if (!layer) return;
    const draftLayer = {
      ...layer,
      textures: Object.values(draft.textures).map((texture) => structuredClone(texture))
    };
    const selectedIndex = store.layers.indexOf(layer);
    const previewLayers = draft.previewMode === 'all'
      ? store.layers.map((entry, index) => {
        if (entry.id === layer.id) return draftLayer;
        if (index >= selectedIndex) return entry;
        const textures = entry.textures.map((texture) => structuredClone(texture));
        Object.values(draft.textures)
          .filter((texture) => texture.propagateDown)
          .forEach((texture) => {
            if (!textures.some((item) => item.type === texture.type)) {
              textures.push(structuredClone(texture));
            }
          });
        return { ...entry, textures };
      })
      : [draftLayer];

    preview.classList.toggle('patterns-only', draft.previewMode === 'none');
    preview.replaceChildren(...previewLayers.map((entry, index) => (
      buildLayerElement(entry, index, previewLayers, store.production)
    )));
    const count = Object.keys(draft.textures).length;
    document.querySelector('#patternSelectionCount').textContent = `${count} texture${count > 1 ? 's' : ''} sélectionnée${count > 1 ? 's' : ''}`;
    document.querySelector('#applyPatterns').disabled = count === 0;

    document.querySelectorAll('.pattern-choice').forEach((choice) => {
      const type = choice.dataset.pattern;
      const texture = draft.textures[type];
      const active = Boolean(texture);
      choice.querySelector('.pattern-choice-toggle').checked = active;
      choice.classList.toggle('active', active);
      choice.querySelector('.pattern-choice-controls').hidden = !active;
      const spacing = texture?.geometry.spacing ?? layer.style.gridSize;
      choice.querySelector('.pattern-spacing-input').value = spacing;
      choice.querySelector('.pattern-spacing-output').textContent = `${spacing} px`;
      choice.querySelector('.pattern-propagate').checked = Boolean(texture?.propagateDown);

      const treatment = texture?.holographicTreatment;
      choice.querySelector('.texture-holo-toggle').checked = Boolean(treatment);
      choice.querySelector('.texture-holo-settings').hidden = !treatment;
      choice.querySelector('.texture-intensity').value = treatment?.intensity ?? layer.style.foilIntensity;
      choice.querySelector('.texture-intensity-output').textContent = `${treatment?.intensity ?? layer.style.foilIntensity}%`;
      choice.querySelector('.response-palette').value = treatment?.palette || layer.style.palette;
      responseProfiles[type].controls.forEach(([property, , defaultValue]) => {
        const value = treatment?.[property] ?? defaultValue;
        choice.querySelector(`.response-input[data-property="${property}"]`).value = value;
        choice.querySelector(`.response-output[data-property="${property}"]`).textContent = `${value}%`;
      });

      const animation = texture?.digitalAnimation;
      choice.querySelector('.texture-animation-toggle').checked = Boolean(animation?.enabled);
      choice.querySelector('.texture-animation-settings').hidden = !animation?.enabled;
      choice.querySelector('.texture-animation-mode').value = animation?.mode === 'none' ? 'shimmer' : (animation?.mode || 'shimmer');
      choice.querySelector('.texture-speed').value = animation?.speed || 1;
      choice.querySelector('.texture-speed-output').textContent = `${animation?.speed || 1}×`;
    });
  }

  function open(layer) {
    store.selectLayer(layer.id);
    draft.layerId = layer.id;
    draft.textures = Object.fromEntries(layer.textures.map((texture) => (
      [texture.type, structuredClone(texture)]
    )));
    draft.previewMode = 'selected';
    document.querySelector('#patternTargetName').textContent = layer.name;
    document.querySelectorAll('[name="patternPreviewMode"]').forEach((input) => {
      input.checked = input.value === 'selected';
    });
    renderPreview();
    dialog.showModal();
  }

  document.querySelectorAll('.pattern-choice').forEach((choice) => {
    const type = choice.dataset.pattern;
    const updateTreatment = (property, value) => {
      draft.textures[type].holographicTreatment[property] = value;
      renderPreview();
    };
    choice.querySelector('.pattern-choice-toggle').addEventListener('change', (event) => {
      if (event.target.checked) draft.textures[type] = createTexture(type, store.selectedLayer.style);
      else delete draft.textures[type];
      renderPreview();
    });
    choice.querySelector('.pattern-spacing-input').addEventListener('input', (event) => {
      draft.textures[type].geometry.spacing = Number(event.target.value);
      renderPreview();
    });
    choice.querySelector('.pattern-propagate').addEventListener('change', (event) => {
      draft.textures[type].propagateDown = event.target.checked;
      renderPreview();
    });
    choice.querySelector('.texture-holo-toggle').addEventListener('change', (event) => {
      draft.textures[type].holographicTreatment = event.target.checked
        ? createTreatment(type, store.selectedLayer.style)
        : null;
      renderPreview();
    });
    choice.querySelector('.texture-intensity').addEventListener('input', (event) => {
      updateTreatment('intensity', Number(event.target.value));
    });
    choice.querySelector('.response-palette').addEventListener('change', (event) => {
      updateTreatment('palette', event.target.value);
    });
    choice.querySelectorAll('.response-input').forEach((input) => {
      input.addEventListener('input', (event) => {
        updateTreatment(event.target.dataset.property, Number(event.target.value));
      });
    });
    choice.querySelector('.texture-animation-toggle').addEventListener('change', (event) => {
      const animation = draft.textures[type].digitalAnimation;
      animation.enabled = event.target.checked;
      animation.mode = event.target.checked && animation.mode === 'none' ? 'shimmer' : animation.mode;
      renderPreview();
    });
    choice.querySelector('.texture-animation-mode').addEventListener('change', (event) => {
      draft.textures[type].digitalAnimation.mode = event.target.value;
      renderPreview();
    });
    choice.querySelector('.texture-speed').addEventListener('input', (event) => {
      draft.textures[type].digitalAnimation.speed = Number(event.target.value);
      renderPreview();
    });
  });

  document.querySelectorAll('[name="patternPreviewMode"]').forEach((input) => {
    input.addEventListener('change', () => {
      draft.previewMode = input.value;
      renderPreview();
    });
  });
  document.querySelector('#applyPatterns').addEventListener('click', () => {
    const layer = store.layers.find((entry) => entry.id === draft.layerId);
    if (!layer) return;
    layer.textures = Object.values(draft.textures).map((texture) => structuredClone(texture));
    dialog.close();
    renderAll();
  });
  ['closePatternDialog', 'cancelPatterns'].forEach((id) => {
    document.querySelector(`#${id}`).addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    dialog.close();
  });

  return { open };
}
