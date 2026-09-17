import { crosshatchTexture } from './crosshatch.js';
import { facetsTexture } from './facets.js';
import { sparkleTexture } from './sparkle.js';
import { zigzagTexture } from './zigzag.js';

export const textureCatalog = Object.fromEntries(
  [crosshatchTexture, sparkleTexture, zigzagTexture, facetsTexture]
    .map((texture) => [texture.type, texture])
);
