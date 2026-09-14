from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
LAYER_DIR = ROOT / "assets" / "paris-master-layers"


def remove_green(source: Path, destination: Path) -> None:
    image = Image.open(source).convert("RGB")
    rgb = np.asarray(image, dtype=np.float32)

    # Distance from the temporary pure-green plate. Two thresholds retain
    # antialiasing while removing the softly varied generated backdrop.
    distance = np.sqrt(
        rgb[..., 0] ** 2 + (255.0 - rgb[..., 1]) ** 2 + rgb[..., 2] ** 2
    )
    distance_alpha = np.clip((distance - 18.0) / 58.0, 0.0, 1.0)
    green_dominance = rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2])
    dominance_alpha = 1.0 - np.clip((green_dominance - 12.0) / 115.0, 0.0, 1.0)
    alpha = np.minimum(distance_alpha, dominance_alpha)

    # Undo green contamination on partially transparent edge pixels.
    safe_alpha = np.maximum(alpha, 1.0 / 255.0)[..., None]
    green_plate = np.array([0.0, 255.0, 0.0], dtype=np.float32)
    foreground = (rgb - (1.0 - alpha[..., None]) * green_plate) / safe_alpha
    foreground = np.clip(foreground, 0.0, 255.0)

    rgba = np.dstack((foreground, alpha[..., None] * 255.0)).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(destination)


sources = {
    "01-foreground-person-roof.png": Path(
        "/Users/adi/.codex/generated_images/01a0a064-a51d-7971-a048-f1e16632a292/exec-133b38c2-5c7c-49b7-8ce1-5a79037a37d9.png"
    ),
    "02-middle-city.png": Path(
        "/Users/adi/.codex/generated_images/01a0a064-a51d-7971-a048-f1e16632a292/exec-eec386fb-26e4-4a49-8d11-0d3df4222a75.png"
    ),
    "03-eiffel-distance.png": Path(
        "/Users/adi/.codex/generated_images/01a0a064-a51d-7971-a048-f1e16632a292/exec-8429464d-54f8-43bd-859c-0ee0f5189fbd.png"
    ),
}

for name, source in sources.items():
    remove_green(source, LAYER_DIR / name)

sky = Image.open(LAYER_DIR / "04-sky-background.png").convert("RGBA")
eiffel = Image.open(LAYER_DIR / "03-eiffel-distance.png").convert("RGBA")
city = Image.open(LAYER_DIR / "02-middle-city.png").convert("RGBA")
foreground = Image.open(LAYER_DIR / "01-foreground-person-roof.png").convert("RGBA")

preview = Image.alpha_composite(sky, eiffel)
preview = Image.alpha_composite(preview, city)
preview = Image.alpha_composite(preview, foreground)
preview.convert("RGB").save(LAYER_DIR / "preview-composite.jpg", quality=95)
