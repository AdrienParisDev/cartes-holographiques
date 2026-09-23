import { interactionDefaults } from '../config/holography.js';

export function initCardMotion() {
  const card = document.querySelector('#holoCard');
  const stage = document.querySelector('#cardStage');
  const ambientGlow = document.querySelector('.ambient-glow');
  const motionButton = document.querySelector('#enableDeviceMotion');
  const touchDevice = window.matchMedia('(hover: none) and (pointer: coarse)');
  const mobileLayout = window.matchMedia('(max-width:700px)');
  const mobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const useDeviceMotion = mobileDevice && touchDevice.matches;
  const syncMotionButton = () => { motionButton.hidden = !(mobileLayout.matches || useDeviceMotion); };
  mobileLayout.addEventListener('change', syncMotionButton);
  syncMotionButton();
  const motion = {
    rotationX: interactionDefaults.rotationX,
    rotationY: interactionDefaults.rotationY
  };

  function setCardPosition(x = 0.5, y = 0.5) {
    card.style.setProperty('--x', `${x * 100}%`);
    card.style.setProperty('--y', `${y * 100}%`);
    card.style.setProperty('--rx', `${(0.5 - y) * motion.rotationX * 2}deg`);
    card.style.setProperty('--ry', `${(x - 0.5) * motion.rotationY * 2}deg`);
    const lightAngle = Math.atan2(y - 0.5, x - 0.5) * 180 / Math.PI;    card.style.setProperty('--light-angle', `${lightAngle}deg`);    card.style.setProperty('--tilt-x', String((0.5 - y) * 2));    card.style.setProperty('--tilt-y', String((x - 0.5) * 2));
  }

  function updateLight() {
    const opacity = Number(document.querySelector('#glareOpacity').value);
    const brightness = Number(document.querySelector('#glareBrightness').value);
    const spread = Number(document.querySelector('#glareSpread').value);
    const concentration = Number(document.querySelector('#glareConcentration').value);
    const blendMode = document.querySelector('[name="glareBlendMode"]:checked').value;
    const coreSize = 22 - concentration * 0.17;
    card.style.setProperty('--glare-opacity', opacity / 100);
    card.style.setProperty('--glare-brightness', brightness / 100);
    card.style.setProperty('--glare-spread', `${spread}%`);
    card.style.setProperty('--glare-core-size', `${coreSize.toFixed(1)}%`);
    card.style.setProperty('--glare-core-opacity', Math.min(1, 0.25 + brightness / 650));
    card.style.setProperty('--holo-response-opacity', Math.min(0.9, brightness / 700));
    card.style.setProperty('--glare-blend-mode', blendMode);
    document.querySelector('#glareOpacityValue').textContent = `${opacity}%`;
    document.querySelector('#glareBrightnessValue').textContent = `${brightness}%`;
    document.querySelector('#glareSpreadValue').textContent = `${spread}%`;
    document.querySelector('#glareConcentrationValue').textContent = `${concentration}%`;
  }

  function updateHalo() {
    const intensity = Number(document.querySelector('#haloIntensity').value);
    const extent = Number(document.querySelector('#haloExtent').value);
    const normalizedIntensity = intensity / 100;
    ambientGlow.style.setProperty('--halo-opacity', normalizedIntensity);
    ambientGlow.style.setProperty('--halo-size', `${Math.round(420 * extent / 100)}px`);
    ambientGlow.style.setProperty('--halo-blur', `${Math.round(10 + (extent - 60) * 0.04)}px`);
    card.style.setProperty('--halo-edge-opacity', normalizedIntensity * 0.34);
    card.style.setProperty('--halo-edge-spread', `${Math.round(5 + (extent - 60) * 0.035)}px`);
    document.querySelector('#haloIntensityValue').textContent = `${intensity}%`;
    document.querySelector('#haloExtentValue').textContent = `${extent}%`;

    const inspectionGlow = document.querySelector('.inspection-glow');
    if (inspectionGlow) {
      inspectionGlow.style.setProperty('--halo-opacity', intensity / 100);
      inspectionGlow.style.setProperty('--halo-scale', extent / 100);
      inspectionGlow.style.setProperty('--halo-blur', `${Math.round(13 + (extent - 60) * 0.05)}px`);
      const inspectionCard = document.querySelector('#inspectionCard');
      inspectionCard?.style.setProperty('--halo-edge-opacity', normalizedIntensity * 0.34);
      inspectionCard?.style.setProperty('--halo-edge-spread', `${Math.round(7 + (extent - 60) * 0.045)}px`);
    }
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

  stage.addEventListener('pointermove', (event) => {
    if (useDeviceMotion || event.pointerType === 'touch') return;
    const bounds = card.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    card.classList.add('interacting');
    setCardPosition(x, y);
  });
  stage.addEventListener('pointerleave', () => {
    if (useDeviceMotion) return;
    card.classList.remove('interacting');
    setCardPosition();
  });

  {
    let origin = null;
    const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));
    const onOrientation = (event) => {
      if (!Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
      origin ||= { beta: event.beta, gamma: event.gamma };
      const orientation = screen.orientation?.angle ?? window.orientation ?? 0;
      const beta = clamp(event.beta - origin.beta, 30);
      const gamma = clamp(event.gamma - origin.gamma, 30);
      const horizontal = orientation === 90 ? beta : orientation === 270 || orientation === -90 ? -beta : gamma;
      const vertical = orientation === 90 ? -gamma : orientation === 270 || orientation === -90 ? gamma : beta;
      const x = clamp(horizontal / 30, 1);
      const y = clamp(vertical / 30, 1);
      card.style.setProperty('--x', `${50 + x * 35}%`);
      card.style.setProperty('--y', `${50 + y * 35}%`);
      card.style.setProperty('--rx', `${-y * motion.rotationX}deg`);
      card.style.setProperty('--ry', `${x * motion.rotationY}deg`);
      card.style.setProperty('--tilt-x', String(-y));
      card.style.setProperty('--tilt-y', String(x));
      card.style.setProperty('--light-angle', `${Math.atan2(y, x) * 180 / Math.PI}deg`);
    };
    motionButton.addEventListener('click', async () => {
      if (!mobileDevice) {
        motionButton.textContent = 'Gyroscope à tester sur téléphone';
        return;
      }
      if (typeof DeviceOrientationEvent === 'undefined') {
        motionButton.textContent = 'Gyroscope indisponible';
        motionButton.disabled = true;
        return;
      }
      try {
        if (typeof DeviceOrientationEvent.requestPermission === 'function' &&
            await DeviceOrientationEvent.requestPermission() !== 'granted') return;
        origin = null;
        window.addEventListener('deviceorientation', onOrientation, { passive: true });
        motionButton.textContent = 'Gyroscope activé';
        motionButton.disabled = true;
      } catch {
        motionButton.textContent = 'Autorisation refusée';
      }
    });
  }

  ['glareOpacity', 'glareBrightness', 'glareSpread', 'glareConcentration'].forEach((id) => {
    document.querySelector(`#${id}`).addEventListener('input', updateLight);
  });
  ['haloIntensity', 'haloExtent'].forEach((id) => {
    document.querySelector(`#${id}`).addEventListener('input', updateHalo);
  });
  document.querySelectorAll('[name="glareBlendMode"]').forEach((input) => {
    input.addEventListener('change', updateLight);
  });
  ['rotationX', 'rotationY', 'perspective'].forEach((id) => {
    document.querySelector(`#${id}`).addEventListener('input', updateMotion);
  });
  document.querySelector('#resetLight').addEventListener('click', () => {
    document.querySelector('#glareOpacity').value = interactionDefaults.glareOpacity;
    document.querySelector('#glareBrightness').value = interactionDefaults.glareBrightness;
    document.querySelector('#glareSpread').value = interactionDefaults.glareSpread;
    document.querySelector('#glareConcentration').value = interactionDefaults.glareConcentration;
    document.querySelector(`[name="glareBlendMode"][value="${interactionDefaults.glareBlendMode}"]`).checked = true;
    document.querySelector('#haloIntensity').value = interactionDefaults.haloIntensity;
    document.querySelector('#haloExtent').value = interactionDefaults.haloExtent;
    updateLight();
    updateHalo();
  });
  document.querySelector('#resetMotion').addEventListener('click', () => {
    ['rotationX', 'rotationY', 'perspective'].forEach((id) => {
      document.querySelector(`#${id}`).value = interactionDefaults[id];
    });
    updateMotion();
    setCardPosition();
  });
  document.querySelector('#springMotion').addEventListener('change', (event) => {
    card.classList.toggle('no-spring', !event.target.checked);
  });

  setCardPosition();
  updateLight();
  updateHalo();
  updateMotion();
}
