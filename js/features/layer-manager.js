import { getEffectiveTextures, getPropagatedTextureSources } from '../models/texture.js';
import { textureCatalog } from '../models/textures/texture-catalog.js';
import { escapeHtml } from '../utils/dom.js';
import { getPropagatedSupportSources } from '../models/support-propagation.js';

export function initLayerManager(store, actions) {
  const { renderAll, renderLayerStack, renderLayerEffectInspector, openTextureEditor, imageCropper } = actions;
  const expandedLayers = new Set();

  function renderManager() {
    const manager = document.querySelector('#layerManager');
    manager.replaceChildren();
    store.layers.forEach((layer) => {
      const item = document.createElement('div');
      item.className = `layer-item${layer.id === store.selectedLayerId ? ' selected' : ''}${expandedLayers.has(layer.id) ? ' mobile-expanded' : ''}`;
      item.dataset.layerId = layer.id;
      item.innerHTML = `
        <button class="layer-drag-handle" type="button" draggable="true" aria-label="Déplacer ${escapeHtml(layer.name)}" title="Glisser pour réordonner">⠿</button><span class="layer-mobile-order"><button class="layer-order-up" type="button" aria-label="Avancer ${escapeHtml(layer.name)} vers le premier plan" ${store.layers.indexOf(layer) === store.layers.length - 1 ? 'disabled' : ''}>↑</button><button class="layer-order-down" type="button" aria-label="Reculer ${escapeHtml(layer.name)} vers l’arrière-plan" ${store.layers.indexOf(layer) === 0 ? 'disabled' : ''}>↓</button></span>
        <button class="layer-mobile-heading" type="button" aria-expanded="${expandedLayers.has(layer.id)}" aria-controls="layer-details-${layer.id}"><span>${escapeHtml(layer.name)}</span><span class="layer-expand-icon" aria-hidden="true">⌄</span></button>
        <div class="layer-select"><div class="layer-media-tools"><button class="layer-thumb-button" type="button" aria-label="Sélectionner ${escapeHtml(layer.name)}"><img class="layer-thumb" alt=""></button><div class="layer-quick-actions"><button class="visibility${layer.visible ? '' : ' off'}" type="button" aria-label="${layer.visible ? 'Masquer' : 'Afficher'} ${escapeHtml(layer.name)}" aria-pressed="${layer.visible}"><span aria-hidden="true">${layer.visible ? '◉' : '○'}</span><b>${layer.visible ? 'Masquer' : 'Afficher'}</b></button><button class="layer-resize" type="button"><span aria-hidden="true">⤢</span><b>Redimensionner</b></button><button class="layer-replace" type="button"><span aria-hidden="true">✎</span><b>Remplacer</b></button></div></div><span class="layer-copy" id="layer-details-${layer.id}"><span class="layer-name-controls"><input class="layer-inline-name" type="text" maxlength="60" value="${escapeHtml(layer.name)}" aria-label="Nom du calque"><span class="layer-primary-actions"></span></span><span class="layer-texture-list"></span><span class="layer-propagation"><small>Propagation des effets aux calques inférieurs</small><span class="layer-propagation-actions"></span></span><span class="layer-received-effects" hidden><small>Effets reçus par propagation</small><span class="layer-received-list"></span></span></span></div>
        <div class="layer-position-wrap"><span class="layer-position" title="Position dans la pile">${store.layers.length - store.layers.indexOf(layer)}</span></div>`;
      item.querySelector('.layer-thumb').src = layer.src;
      item.querySelector('.layer-mobile-heading').addEventListener('click', () => {
        if (expandedLayers.has(layer.id)) expandedLayers.delete(layer.id);
        else expandedLayers.add(layer.id);
        item.classList.toggle('mobile-expanded', expandedLayers.has(layer.id));
        item.querySelector('.layer-mobile-heading').setAttribute('aria-expanded', String(expandedLayers.has(layer.id)));
      });
      item.querySelector('.layer-thumb-button').addEventListener('click', () => {
        store.selectLayer(layer.id);
        renderManager();
        syncControls();
        renderEffectLegend();
        renderLegend();
        renderLayerEffectInspector?.();
      });
      item.querySelector('.visibility').addEventListener('click', () => {
        store.selectLayer(layer.id);
        layer.visible = !layer.visible;
        renderAll();
      });

      const primaryActions = item.querySelector('.layer-primary-actions');
      const textureList = item.querySelector('.layer-texture-list');
      const propagationActions = item.querySelector('.layer-propagation-actions');
      const receivedEffects = item.querySelector('.layer-received-effects');
      const receivedList = item.querySelector('.layer-received-list');
      const reflection = document.createElement('button');
      reflection.type = 'button';
      reflection.className = `layer-treatment-chip reflection${layer.supportInteraction?.mode === 'reveal' ? ' active' : ''}`;
      reflection.textContent = layer.supportInteraction?.mode === 'reveal' ? 'Support révélé ×' : '+ Révéler le support';
      reflection.setAttribute('aria-pressed', String(layer.supportInteraction?.mode === 'reveal'));
      reflection.addEventListener('click', () => {
        store.selectLayer(layer.id);
        layer.supportInteraction.mode = layer.supportInteraction.mode === 'reveal' ? 'opaque' : 'reveal';
        if (layer.supportInteraction.mode === 'reveal') {
          layer.previewVisibility ||= { support: true, hiddenTextureIds: [] };
          layer.previewVisibility.support = true;
        }
        renderAll();
      });
      primaryActions.appendChild(reflection);
      if (layer.clipSupport === undefined) layer.clipSupport = layer.clip ?? true;
      if (layer.clipTextures === undefined) layer.clipTextures = layer.clip ?? true;

      getEffectiveTextures(layer, store.layers).forEach((texture) => {
        const definition = textureCatalog[texture.type];
        if (!definition) return;
        const card = document.createElement('span');
        card.className = `layer-texture-card${texture.inheritedFrom ? ' inherited' : ''}`;
        card.innerHTML = `<span class="layer-texture-sample texture-${texture.type}" aria-hidden="true"></span><span class="layer-texture-copy"><strong>${definition.label}</strong><small>${texture.inheritedFrom ? `Liée depuis ${texture.inheritedFromName}` : texture.propagateDown ? 'Étendue aux calques ↓' : 'Texture du calque'}</small></span><span class="layer-texture-actions"><button class="texture-edit" type="button" aria-label="Modifier ${definition.label}" title="Modifier">✎</button><button class="texture-delete" type="button" aria-label="Supprimer ${definition.label}" title="${texture.inheritedFrom ? 'Texture héritée' : 'Supprimer'}">⌫</button></span>`;
        card.querySelector('.texture-edit').addEventListener('click', () => {
          store.selectLayer(layer.id);
          openTextureEditor(layer);
        });
        const deleteButton = card.querySelector('.texture-delete');
        if (texture.inheritedFrom) deleteButton.disabled = true;
        else deleteButton.addEventListener('click', () => {
          store.selectLayer(layer.id);
          layer.textures = layer.textures.filter((entry) => entry.id !== texture.id);
          renderAll();
        });
        textureList.appendChild(card);
      });
      const addTexture = document.createElement('button');
      addTexture.type = 'button';
      addTexture.className = 'layer-texture-add';
      addTexture.innerHTML = '<span aria-hidden="true">＋</span><b>Ajouter une texture</b>';
      addTexture.addEventListener('click', () => openTextureEditor(layer));
      textureList.appendChild(addTexture);

      const ownTextures = layer.textures;
      const supportPropagates = Boolean(layer.supportInteraction?.propagateDown);
      const texturesPropagate = ownTextures.length > 0 && ownTextures.every((texture) => texture.propagateDown);
      const createPropagationButton = (label, active, disabled, onClick) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `layer-propagation-button${active ? ' active' : ''}`;
        button.textContent = label;
        button.disabled = disabled;
        button.setAttribute('aria-pressed', String(active));
        button.addEventListener('click', onClick);
        return button;
      };
      const supportSources = getPropagatedSupportSources(layer, store.layers);
      const inheritedTextures = getPropagatedTextureSources(layer, store.layers);
      const sourcePosition = (sourceId) => {
        const sourceIndex = store.layers.findIndex((entry) => entry.id === sourceId);
        return sourceIndex < 0 ? '?' : store.layers.length - sourceIndex;
      };
      supportSources.forEach((source, sourceIndex) => {
        const badge = document.createElement('span');
        badge.className = 'received-effect-badge support';
        const sourceState = layer.supportInteraction?.mode === 'reveal'
          ? 'propagation reçue · support local actif'
          : sourceIndex === 0 ? 'source appliquée' : 'source secondaire';
        badge.innerHTML = `<b>Support</b><small>depuis ${sourcePosition(source.id)} · ${escapeHtml(source.name)} · ${sourceState}</small>`;
        receivedList.appendChild(badge);
      });
      inheritedTextures.forEach((texture) => {
        const definition = textureCatalog[texture.type];
        if (!definition) return;
        const badge = document.createElement('span');
        badge.className = `received-effect-badge texture ${definition.color}`;
        const hasLocalTexture = layer.textures.some((entry) => entry.type === texture.type);
        badge.innerHTML = `<b>${escapeHtml(definition.label)}</b><small>depuis ${sourcePosition(texture.inheritedFrom)} · ${escapeHtml(texture.inheritedFromName)}${hasLocalTexture ? ' · texture locale active' : ''}</small>`;
        receivedList.appendChild(badge);
      });
      receivedEffects.hidden = receivedList.childElementCount === 0;

      propagationActions.append(
        createPropagationButton('Support', supportPropagates, false, () => {
          store.selectLayer(layer.id);
          if (!supportPropagates) {
            layer.supportInteraction.mode = 'reveal';
            layer.previewVisibility ||= { support: true, hiddenTextureIds: [] };
            layer.previewVisibility.support = true;
          }
          layer.supportInteraction.propagateDown = !supportPropagates;
          renderAll();
        }),
        createPropagationButton('Textures', texturesPropagate, ownTextures.length === 0, () => {
          store.selectLayer(layer.id);
          const next = !texturesPropagate;
          ownTextures.forEach((texture) => { texture.propagateDown = next; });
          renderAll();
        }),
        createPropagationButton('Support et textures', supportPropagates && texturesPropagate, ownTextures.length === 0, () => {
          store.selectLayer(layer.id);
          const next = !(supportPropagates && texturesPropagate);
          if (next) {
            layer.supportInteraction.mode = 'reveal';
            layer.previewVisibility ||= { support: true, hiddenTextureIds: [] };
            layer.previewVisibility.support = true;
          }
          layer.supportInteraction.propagateDown = next;
          ownTextures.forEach((texture) => { texture.propagateDown = next; });
          renderAll();
        })
      );

      item.addEventListener('click', (event) => {
        if (event.target.closest('button, input, label, select, textarea')) return;
        store.selectLayer(layer.id);
        renderManager();
        syncControls();
        renderEffectLegend();
        renderLegend();
        renderLayerEffectInspector?.();
      });

      const nameInput = item.querySelector('.layer-inline-name');
      nameInput.addEventListener('focus', () => {
        store.selectLayer(layer.id);
        manager.querySelectorAll('.layer-item').forEach((entry) => {
          entry.classList.toggle('selected', entry === item);
        });
        syncControls();
        renderEffectLegend();
        renderLegend();
        renderLayerEffectInspector?.();
      });
      nameInput.addEventListener('click', (event) => event.stopPropagation());
      nameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          nameInput.blur();
        }
      });
      nameInput.addEventListener('input', () => {
        layer.name = nameInput.value || 'Calque sans titre';
        item.querySelector('.layer-mobile-heading span').textContent = layer.name;
        document.querySelector('#previewEffectLayerName').textContent = layer.name;
        syncControls();
        renderLegend();
        renderLayerStack();
      });
      nameInput.addEventListener('change', renderAll);
      item.querySelector('.layer-resize').addEventListener('click', () => imageCropper.openExistingLayer(layer));
      item.querySelector('.layer-replace').addEventListener('click', () => imageCropper.requestImport('replace', layer.id));
      const dragHandle = item.querySelector('.layer-drag-handle');
      item.querySelector('.layer-order-up').addEventListener('click', () => { store.selectLayer(layer.id); store.moveSelected(1); renderAll(); });
      item.querySelector('.layer-order-down').addEventListener('click', () => { store.selectLayer(layer.id); store.moveSelected(-1); renderAll(); });
      dragHandle.addEventListener('dragstart', (event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', layer.id);
        item.classList.add('dragging');
      });
      dragHandle.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        manager.querySelectorAll('.drag-over').forEach((node) => node.classList.remove('drag-over'));
      });
      item.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        item.classList.add('drag-over');
      });
      item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
      item.addEventListener('drop', (event) => {
        event.preventDefault();
        item.classList.remove('drag-over');
        const draggedId = event.dataTransfer.getData('text/plain');
        if (!draggedId || draggedId === layer.id) return;
        const displayOrder = [...store.layers].reverse().map((entry) => entry.id).filter((id) => id !== draggedId);
        const targetIndex = displayOrder.indexOf(layer.id);
        const insertAfter = event.clientY > item.getBoundingClientRect().top + item.offsetHeight / 2;
        displayOrder.splice(targetIndex + (insertAfter ? 1 : 0), 0, draggedId);
        store.reorder(displayOrder.reverse());
        store.selectLayer(draggedId);
        renderAll();
      });
      manager.appendChild(item);
    });
  }

  const managerElement = document.querySelector('#layerManager');
  let lastTouchY = null;
  managerElement.addEventListener('touchstart', (event) => {
    lastTouchY = event.touches[0]?.clientY ?? null;
  }, { passive:true });
  managerElement.addEventListener('touchmove', (event) => {
    if (lastTouchY === null || event.touches.length !== 1 ||
        !window.matchMedia('(max-width:700px)').matches) return;
    const y = event.touches[0].clientY;
    const delta = lastTouchY - y;
    lastTouchY = y;
    const bounds = managerElement.getBoundingClientRect();
    const atTop = managerElement.lastElementChild?.getBoundingClientRect().top >= bounds.top - 1 && delta < 0;
    const atBottom = managerElement.firstElementChild?.getBoundingClientRect().bottom <= bounds.bottom + 1 && delta > 0;
    if (atTop || atBottom) {
      event.preventDefault();
      window.scrollBy(0, delta);
    }
  }, { passive:false });
  managerElement.addEventListener('touchend', () => { lastTouchY = null; }, { passive:true });
  managerElement.addEventListener('touchcancel', () => { lastTouchY = null; }, { passive:true });
  managerElement.addEventListener('dragover', (event) => {
    const bounds = managerElement.getBoundingClientRect();
    const edgeZone = Math.min(64, bounds.height * 0.22);
    const distanceFromTop = event.clientY - bounds.top;
    const distanceFromBottom = bounds.bottom - event.clientY;
    if (distanceFromTop < edgeZone) {
      managerElement.scrollBy({ top: -Math.ceil((edgeZone - distanceFromTop) / 5), behavior: 'auto' });
    } else if (distanceFromBottom < edgeZone) {
      managerElement.scrollBy({ top: Math.ceil((edgeZone - distanceFromBottom) / 5), behavior: 'auto' });
    }
  });

  function renderLegend() {
    const legend = document.querySelector('#previewLayerLegend');
    legend.replaceChildren();
    [...store.layers].reverse().forEach((layer, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `layer-toggle${layer.visible ? ' active' : ''}${layer.id === store.selectedLayerId ? ' selected' : ''}`;
      button.setAttribute('aria-pressed', String(layer.visible));
      button.innerHTML = `<i style="background:hsl(${265 - index * 42} 80% 68%)"></i>${escapeHtml(layer.name)}<b>●</b>`;
      button.addEventListener('click', () => {
        layer.visible = !layer.visible;
        renderAll();
      });
      legend.appendChild(button);
    });
  }

  function renderEffectLegend() {
    const layer = store.selectedLayer;
    document.querySelector('#previewEffectLayerName').textContent = layer.name;
    const legend = document.querySelector('#previewEffectLegend');
    legend.replaceChildren();
    layer.previewVisibility ||= { support: true, hiddenTextureIds: [] };
    layer.previewVisibility.hiddenTextureIds ||= [];

    const localEffects = [];
    if (layer.supportInteraction?.mode === 'reveal') {
      localEffects.push({
        key: 'support',
        label: 'Support révélé',
        color: 'pink',
        visible: layer.previewVisibility.support !== false
      });
    }
    layer.textures.forEach((texture) => {
      const definition = textureCatalog[texture.type];
      if (!definition) return;
      localEffects.push({
        key: `texture-${texture.id}`,
        textureId: texture.id,
        label: definition.label,
        color: definition.color,
        visible: !layer.previewVisibility.hiddenTextureIds.includes(texture.id)
      });
    });

    localEffects.forEach((effect) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `effect-preview-toggle${effect.visible ? ' active' : ''}`;
      button.setAttribute('aria-pressed', String(effect.visible));
      button.setAttribute('aria-label', `${effect.visible ? 'Masquer' : 'Afficher'} ${effect.label} sur ${layer.name}`);
      button.innerHTML = `<i class="${effect.color}"></i>${escapeHtml(effect.label)}`;
      button.addEventListener('click', () => {
        if (effect.key === 'support') {
          layer.previewVisibility.support = !effect.visible;
        } else {
          const hidden = new Set(layer.previewVisibility.hiddenTextureIds);
          if (effect.visible) hidden.add(effect.textureId);
          else hidden.delete(effect.textureId);
          layer.previewVisibility.hiddenTextureIds = [...hidden];
        }
        renderAll();
      });
      legend.appendChild(button);
    });

    const sourcePosition = (sourceId) => {
      const sourceIndex = store.layers.findIndex((entry) => entry.id === sourceId);
      return sourceIndex < 0 ? '?' : store.layers.length - sourceIndex;
    };
    const activeSupportSources = layer.supportInteraction?.mode === 'reveal' && layer.previewVisibility.support !== false
      ? []
      : getPropagatedSupportSources(layer, store.layers).slice(0, 1);
    activeSupportSources.forEach((source) => {
      const badge = document.createElement('span');
      badge.className = 'effect-preview-inherited';
      badge.innerHTML = `<i class="pink"></i><span>Support hérité<small>depuis ${sourcePosition(source.id)} · ${escapeHtml(source.name)}</small></span><b aria-hidden="true">↳</b>`;
      legend.appendChild(badge);
    });
    const visibleLocalTypes = new Set(layer.textures
      .filter((texture) => !layer.previewVisibility.hiddenTextureIds.includes(texture.id))
      .map((texture) => texture.type));
    const activeInheritedTypes = new Set();
    getPropagatedTextureSources(layer, store.layers).forEach((texture) => {
      const definition = textureCatalog[texture.type];
      if (!definition || visibleLocalTypes.has(texture.type) || activeInheritedTypes.has(texture.type)) return;
      activeInheritedTypes.add(texture.type);
      const badge = document.createElement('span');
      badge.className = 'effect-preview-inherited';
      badge.innerHTML = `<i class="${definition.color}"></i><span>${escapeHtml(definition.label)} héritée<small>depuis ${sourcePosition(texture.inheritedFrom)} · ${escapeHtml(texture.inheritedFromName)}</small></span><b aria-hidden="true">↳</b>`;
      legend.appendChild(badge);
    });

    if (!legend.childElementCount) {
      const empty = document.createElement('span');
      empty.className = 'effect-preview-empty';
      empty.textContent = 'Aucun traitement sur ce calque';
      legend.appendChild(empty);
    }
  }

  function syncControls() {
    const layer = store.selectedLayer;
    if (!layer) return;
    document.querySelector('#layerCount').textContent = `${store.layers.length} calque${store.layers.length > 1 ? 's' : ''}`;
    const index = store.layers.indexOf(layer);
    document.querySelector('#moveLayerUp').disabled = index === store.layers.length - 1;
    document.querySelector('#moveLayerDown').disabled = index === 0;
    const deleteButton = document.querySelector('#deleteLayer');
    deleteButton.disabled = store.layers.length === 1;
    deleteButton.textContent = `⌫ Supprimer « ${layer.name} »`;
    deleteButton.setAttribute('aria-label', `Supprimer le calque ${layer.name}`);
    deleteButton.title = `Supprimer le calque « ${layer.name} »`;
  }

  document.querySelector('#moveLayerUp').addEventListener('click', () => { store.moveSelected(1); renderAll(); });
  document.querySelector('#moveLayerDown').addEventListener('click', () => { store.moveSelected(-1); renderAll(); });
  document.querySelector('#deleteLayer').addEventListener('click', () => { store.deleteLayer(store.selectedLayerId); renderAll(); });

  return { renderManager, renderLegend, renderEffectLegend, syncControls };
}
