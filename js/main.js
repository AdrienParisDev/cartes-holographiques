import { initCardMotion } from './features/card-motion.js';
import { initFormAccordion } from './features/form-accordion.js';
import { initImageCropper } from './features/image-cropper.js?v=effect-preview-2';
import { initInspection } from './features/inspection.js?v=effect-preview-2';
import { initProductionSettings } from './features/production-settings.js?v=output-modes-1';
import { initLayerManager } from './features/layer-manager.js?v=effect-preview-2';
import { initLayerEffectInspector } from './features/layer-effect-inspector.js?v=output-modes-1';
import { initTextureEditor } from './features/texture-editor.js?v=effect-preview-2';
import { initOutputMode } from './features/output-mode.js';
import { renderLayerStack as renderStack } from './rendering/layer-renderer.js?v=effect-preview-2';
import { createCardStore } from './state/card-store.js?v=effect-preview-2';
import { initCardExamples } from './features/card-examples.js';

const store = createCardStore();
let layerManager;
let layerEffectInspector;

function renderLayerStack() {
  renderStack(store.layers, undefined, store.production);
}

function renderAll() {
  renderLayerStack();
  layerManager.renderManager();
  layerManager.renderLegend();
  layerManager.syncControls();
  layerManager.renderEffectLegend();
  layerEffectInspector?.render();
}

const imageCropper = initImageCropper(store, renderAll);
const textureEditor = initTextureEditor(store, renderAll);
initOutputMode();

layerManager = initLayerManager(store, {
  renderAll,
  renderLayerStack,
  renderLayerEffectInspector: () => layerEffectInspector?.render(),
  openTextureEditor: textureEditor.open,
  imageCropper
});

layerEffectInspector = initLayerEffectInspector(store, renderAll, renderLayerStack);

const productionSettings = initProductionSettings(store, renderAll);
initFormAccordion();
initCardMotion();
initInspection(store, renderAll);

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((item) => item.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`[data-section="${tab.dataset.target}"]`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  });
});

document.querySelector('#cardName').addEventListener('input', (event) => {
  document.querySelector('#previewCardName').textContent = event.target.value.trim() || 'Carte sans titre';
});

renderAll();
initCardExamples(store, renderAll, productionSettings);
