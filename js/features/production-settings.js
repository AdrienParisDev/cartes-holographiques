import { evaluateProductionCompatibility, supportsTexture } from '../models/production/compatibility.js';
import { finishCatalog } from '../models/production/finishes.js';
import { printingProcessCatalog } from '../models/production/printing-processes.js';
import { substrateCatalog } from '../models/production/substrates.js';
import { textureCatalog } from '../models/textures/texture-catalog.js';
import { createMaterialBackground } from '../rendering/material-renderer.js';

function fillSelect(select, catalog) {
  select.replaceChildren(...Object.entries(catalog).map(([value, entry]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = entry.label;
    return option;
  }));
}

export function initProductionSettings(store, renderAll) {
  const production = store.production;
  const substrateSelect = document.querySelector('#substrateType');
  const processSelect = document.querySelector('#printingProcess');
  const finishSelect = document.querySelector('#baseFinish');
  const compatibility = document.querySelector('#productionCompatibility');

  fillSelect(substrateSelect, substrateCatalog);
  fillSelect(processSelect, printingProcessCatalog);
  fillSelect(finishSelect, finishCatalog);
  substrateSelect.value = production.substrate;
  processSelect.value = production.printingProcess;
  finishSelect.value = production.finish;
  document.querySelector('#inkSystem').value = production.inkSystem;
  document.querySelector('#supportMaterial').value = production.support.material;
  document.querySelector('#supportPalette').value = production.support.palette;
  document.querySelector('#supportIntensity').value = production.support.intensity;
  document.querySelector('#supportBlendMode').value = production.support.blendMode;
  document.querySelector('#supportAngle').value = production.support.angle;

  document.querySelectorAll('.card-surface').forEach((surface) => {
    if (!surface.querySelector(':scope > .support-surface')) {
      surface.prepend(Object.assign(document.createElement('div'), { className: 'support-surface' }));
    }
  });

  function updateCompatibility() {
    const messages = evaluateProductionCompatibility(production);
    const textureMessages = [];
    store.layers.forEach((layer) => layer.textures.forEach((texture) => {
      const result = supportsTexture(production, textureCatalog[texture.type]);
      if (result.level !== 'compatible') {
        textureMessages.push(`${textureCatalog[texture.type].label} sera adaptée en ${result.fallback || 'simulation imprimée'}.`);
      }
    }));
    const allMessages = [...messages, ...textureMessages.map((text) => ({ level: 'fallback', text }))];
    compatibility.className = `production-compatibility print-only ${allMessages.some((message) => message.level === 'incompatible') ? 'incompatible' : allMessages.some((message) => message.level === 'fallback') ? 'fallback' : 'compatible'}`;
    compatibility.innerHTML = allMessages.map((message) => `<span>${message.text}</span>`).join('');
  }

  function renderSupport() {
    const substrate = substrateCatalog[production.substrate];
    document.querySelectorAll('.holo-card').forEach((card) => {
      card.dataset.substrate = production.substrate;
      card.style.setProperty('--substrate-tint', substrate.appearance.tint);
      card.style.setProperty('--substrate-reflectivity', substrate.appearance.reflectivity);
      card.style.setProperty('--substrate-roughness', substrate.appearance.roughness);
    });
    document.querySelectorAll('.support-surface').forEach((surface) => {
      surface.style.backgroundColor = substrate.appearance.tint;
      surface.style.backgroundImage = createMaterialBackground(production.support, production.support.angle);
      surface.style.mixBlendMode = production.support.blendMode;
      surface.style.opacity = String(production.support.intensity / 100);
    });
    document.querySelector('#supportIntensityValue').textContent = `${production.support.intensity}%`;
    updateCompatibility();
  }

  const bind = (id, update) => {
    document.querySelector(`#${id}`).addEventListener('change', (event) => {
      update(event.target.value);
      renderSupport();
      renderAll();
    });
  };
  bind('substrateType', (value) => { production.substrate = value; });
  bind('printingProcess', (value) => { production.printingProcess = value; });
  bind('inkSystem', (value) => { production.inkSystem = value; });
  bind('baseFinish', (value) => { production.finish = value; });
  bind('supportMaterial', (value) => { production.support.material = value; });
  bind('supportPalette', (value) => { production.support.palette = value; });
  bind('supportBlendMode', (value) => { production.support.blendMode = value; });
  bind('supportAngle', (value) => { production.support.angle = Number(value); });
  document.querySelector('#supportIntensity').addEventListener('input', (event) => {
    production.support.intensity = Number(event.target.value);
    renderSupport();
    renderAll();
  });

  renderSupport();
  return { render: renderSupport };
}
