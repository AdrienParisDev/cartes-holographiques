function createPreviewSection(lightSection, motionSection) {
  const section = document.createElement('section');
  section.id = 'previewSettingsSection';
  section.className = 'form-section';
  section.dataset.section = 'preview';
  section.innerHTML = `
    <div class="form-title">
      <span>04</span>
      <div><h3>Paramètres de prévisualisation</h3><p>Réglez l’éclairage et le comportement 3D de l’aperçu.</p></div>
    </div>`;

  const content = document.createDocumentFragment();
  [
    ['Éclairage', 'Reflet sur la carte et lumière autour.', lightSection],
    ['Mouvement 3D', 'Inclinaison, perspective et inertie.', motionSection]
  ].forEach(([title, description, source]) => {
    const group = document.createElement('div');
    group.className = 'preview-settings-group';
    group.innerHTML = `<div class="preview-subheading"><div><strong>${title}</strong><small>${description}</small></div></div>`;
    const oldTitle = source.querySelector('.form-title');
    const reset = oldTitle?.querySelector('.reset-section');
    if (reset) group.querySelector('.preview-subheading').appendChild(reset);
    [...source.children].filter((child) => child !== oldTitle).forEach((child) => group.appendChild(child));
    content.appendChild(group);
  });
  section.appendChild(content);
  lightSection.before(section);
  lightSection.remove();
  motionSection.remove();
  return section;
}

function mergeLayerSections(layers, layerEffects) {
  const oldTitle = layerEffects.querySelector(':scope > .form-title');
  const group = document.createElement('div');
  const heading = document.createElement('div');

  group.className = 'layer-editor-group';
  heading.className = 'layer-subheading';
  heading.innerHTML = '<div><strong>Réglages du calque actif</strong><small>La vignette encadrée indique le calque actuellement modifié.</small></div>';
  group.appendChild(heading);
  [...layerEffects.children]
    .filter((child) => child !== oldTitle)
    .forEach((child) => group.appendChild(child));
  layers.appendChild(group);
  layerEffects.remove();
  return layers;
}

function enhanceAccordion(section, { id, open = false, summary }) {
  const title = section.querySelector(':scope > .form-title');
  const number = title.querySelector(':scope > span');
  const copy = title.querySelector(':scope > div');
  const reset = title.querySelector('.reset-section');
  const header = document.createElement('div');
  const button = document.createElement('button');
  const panel = document.createElement('div');
  const inner = document.createElement('div');
  const summaryNode = document.createElement('span');
  const chevron = document.createElement('span');

  section.classList.add('form-accordion');
  section.dataset.accordionId = id;
  header.className = 'form-accordion-header';
  button.className = 'form-accordion-toggle';
  button.type = 'button';
  button.setAttribute('aria-expanded', String(open));
  button.setAttribute('aria-controls', `${id}-panel`);
  number.className = 'form-step-number';
  copy.className = 'form-accordion-copy';
  summaryNode.className = 'form-accordion-summary';
  summaryNode.textContent = summary();
  copy.appendChild(summaryNode);
  chevron.className = 'form-accordion-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.textContent = '⌄';
  button.append(number, copy, chevron);
  header.appendChild(button);
  if (reset) header.appendChild(reset);

  panel.id = `${id}-panel`;
  panel.className = 'form-accordion-panel';
  panel.setAttribute('aria-hidden', String(!open));
  inner.className = 'form-accordion-inner';
  [...section.children].filter((child) => child !== title).forEach((child) => inner.appendChild(child));
  panel.appendChild(inner);
  section.replaceChildren(header, panel);
  section.classList.toggle('is-open', open);

  const setOpen = (nextOpen) => {
    section.classList.toggle('is-open', nextOpen);
    button.setAttribute('aria-expanded', String(nextOpen));
    panel.setAttribute('aria-hidden', String(!nextOpen));
  };
  button.addEventListener('click', () => setOpen(!section.classList.contains('is-open')));

  return {
    refresh() { const nextSummary = summary(); if (summaryNode.textContent !== nextSummary) summaryNode.textContent = nextSummary; }
  };
}

export function initFormAccordion() {
  const form = document.querySelector('.card-form');
  document.querySelector('.tabs')?.remove();
  document.querySelector('.step-counter').textContent = '4 étapes';

  const sections = [...form.querySelectorAll(':scope > .form-section')];
  const identity = sections.find((section) => section.querySelector('h3')?.textContent === 'Identité de la carte');
  const production = sections.find((section) => section.dataset.section === 'production');
  const layers = sections.find((section) => section.querySelector('h3')?.textContent === 'Calques visuels');
  const layerEffects = sections.find((section) => section.querySelector('h3')?.textContent === 'Calque & textures');
  const light = sections.find((section) => section.querySelector('h3')?.textContent === 'Lumière & reflet');
  const motion = sections.find((section) => section.querySelector('h3')?.textContent === 'Mouvement 3D');


  identity.classList.add('identity-section');
  document.querySelectorAll('.holo-card').forEach((card) => {
    card.classList.remove('finish-grain', 'finish-scratches', 'finish-glitter');
  });

  const combinedLayers = mergeLayerSections(layers, layerEffects);
  const preview = createPreviewSection(light, motion);
  const controllers = [
    enhanceAccordion(production, {
      id: 'production-settings',
      summary: () => document.body.dataset.outputMode === 'print'
        ? `${document.querySelector('#substrateType')?.selectedOptions[0]?.textContent || 'Support'} · ${document.querySelector('#printingProcess')?.selectedOptions[0]?.textContent || 'Impression'}`
        : `${document.querySelector('#supportMaterial')?.selectedOptions[0]?.textContent || 'Matière'} · ${document.querySelector('#supportPalette')?.selectedOptions[0]?.textContent || 'Palette'}`
    }),
    enhanceAccordion(combinedLayers, {
      id: 'visual-layers',
      summary: () => {
        const selectedName = document.querySelector('.layer-item.selected .layer-inline-name')?.value || 'Aucun calque sélectionné';
        return `${document.querySelector('#layerCount')?.textContent || 'Calques'} · ${selectedName}`;
      }
    }),
    enhanceAccordion(preview, {
      id: 'preview-settings',
      summary: () => `Reflet ${document.querySelector('#glareOpacity')?.value || 48}% / ${document.querySelector('#glareBrightness')?.value || 100}% · Ambiance ${document.querySelector('#haloIntensity')?.value || 55}% · Rotation ${document.querySelector('#rotationX')?.value || 14}° / ${document.querySelector('#rotationY')?.value || 18}°`
    })
  ];

  const refresh = () => controllers.forEach((controller) => controller.refresh());
  form.addEventListener('input', refresh);
  form.addEventListener('change', refresh);
  form.addEventListener('click', () => queueMicrotask(refresh));
  new MutationObserver(refresh).observe(form, { subtree: true, childList: true, characterData: true });
}
