import { finishCatalog } from './finishes.js';
import { printingProcessCatalog } from './printing-processes.js';
import { substrateCatalog } from './substrates.js';

export function evaluateProductionCompatibility(production) {
  const substrate = substrateCatalog[production.substrate];
  const process = printingProcessCatalog[production.printingProcess];
  const finish = finishCatalog[production.finish];
  const messages = [];

  if (!process.compatibleSubstrates.includes(production.substrate)) {
    messages.push({
      level: 'incompatible',
      text: `${process.label} n’est pas prévu pour le support ${substrate.label}.`
    });
  }

  if (finish.capability && !substrate.capabilities.includes(finish.capability)) {
    messages.push({
      level: 'fallback',
      text: `${finish.label} nécessite une adaptation sur ${substrate.label}. Une simulation imprimée pourra être utilisée.`
    });
  }

  return messages.length ? messages : [{ level: 'compatible', text: 'Profil générique compatible.' }];
}

export function supportsTexture(production, textureDefinition) {
  const requirements = textureDefinition.productionRequirements;
  if (!requirements) return { level: 'compatible' };
  const substrateAllowed = !requirements.substrates || requirements.substrates.includes(production.substrate);
  return substrateAllowed
    ? { level: 'compatible' }
    : { level: 'fallback', fallback: requirements.fallbacks?.[production.substrate] };
}
