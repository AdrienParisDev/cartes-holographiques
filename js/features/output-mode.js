const modeCopy = {
  digital: {
    title: 'Rendu holographique',
    description: 'Réglez la matière lumineuse simulée à l’écran.',
    label: 'Numérique',
    note: 'Effets optimisés pour un affichage interactif.'
  },
  print: {
    title: 'Support & fabrication',
    description: 'Définissez la matière physique et sa simulation avant fabrication.',
    label: 'Impression',
    note: 'Contraintes de support, d’encres et de finition incluses.'
  }
};

export function initOutputMode() {
  const buttons = [...document.querySelectorAll('.output-mode-button')];
  const title = document.querySelector('#productionSectionTitle');
  const description = document.querySelector('#productionSectionDescription');
  const note = document.querySelector('#modeContextNote');

  function setMode(mode) {
    const copy = modeCopy[mode] || modeCopy.digital;
    document.body.dataset.outputMode = mode;
    buttons.forEach((button) => {
      const active = button.dataset.outputMode === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    title.textContent = copy.title;
    description.textContent = copy.description;
    note.innerHTML = `<b>${copy.label}</b><span>${copy.note}</span>`;
    document.dispatchEvent(new CustomEvent('outputmodechange', { detail: { mode } }));
  }

  buttons.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.outputMode)));
  setMode('digital');
}
