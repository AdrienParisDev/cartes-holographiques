import { palettes } from '../config/holography.js';
import { getMaterial } from '../models/materials/material-catalog.js';

function spectrum(colors, angle) {
  return `linear-gradient(${angle}deg,${colors.join(',')})`;
}

export function createMaterialBackground(treatment, angle = 55) {
  const material = treatment?.material || 'diffraction';
  const colors = palettes[treatment?.palette] || palettes.prism;
  const colorSpectrum = spectrum(colors, angle + 60);

  if (material === 'galaxy') {
    return [
      'radial-gradient(circle at var(--x) var(--y),rgba(255,255,255,.98) 0 1.5%,rgba(122,217,255,.7) 4%,transparent 13%)',
      'radial-gradient(circle at 18% 24%,rgba(255,255,255,.9) 0 1px,transparent 2px)',
      'radial-gradient(circle at 74% 68%,rgba(196,151,255,.8) 0 1px,transparent 2px)',
      `linear-gradient(${angle + 30}deg,rgba(8,5,30,.82),transparent 45%,rgba(28,8,48,.75))`,
      colorSpectrum
    ].join(',');
  }

  if (material === 'spectrum') {
    return `conic-gradient(from ${angle}deg at var(--x) var(--y),${colors.join(',')})`;
  }

  if (material === 'etched-metal') {
    return [
      `repeating-linear-gradient(${angle}deg,rgba(255,255,255,.48) 0 1px,rgba(20,22,31,.18) 1px 3px,transparent 3px 7px)`,
      `linear-gradient(${angle + 90}deg,rgba(255,255,255,.18),rgba(20,24,35,.44),rgba(255,255,255,.28))`,
      colorSpectrum
    ].join(',');
  }

  return [
    `repeating-linear-gradient(${angle}deg,transparent 0 6px,rgba(255,255,255,.58) 7px,transparent 9px)`,
    `repeating-linear-gradient(${180 - angle}deg,transparent 0 8px,rgba(122,232,255,.42) 9px,transparent 11px)`,
    colorSpectrum
  ].join(',');
}

export function materialClassName(treatment) {
  return getMaterial(treatment?.material).className;
}
