"""Turns generated creature paintings on a flat chroma background into one
transparent atlas of square cells, and prints each cell's body metrics.

Usage: python scripts/key-sprite.py OUT.png COLUMNS name=path [name=path ...]
"""
import json
import sys

import numpy as np
from PIL import Image, ImageFilter

CELL = 512
FILL = 0.82


def key(path):
    rgb = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    h, w, _ = rgb.shape
    border = np.concatenate(
        [rgb[:8].reshape(-1, 3), rgb[-8:].reshape(-1, 3),
         rgb[:, :8].reshape(-1, 3), rgb[:, -8:].reshape(-1, 3)]
    )
    bg = np.median(border, axis=0)
    distance = np.linalg.norm(rgb - bg, axis=2)
    alpha = np.clip((distance - 38) / (105 - 38), 0, 1)
    alpha = np.asarray(
        Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3))
    ).astype(np.float32) / 255
    # Remove the background colour blended into soft edges.
    safe = np.maximum(alpha, 0.05)[..., None]
    colour = np.clip((rgb - (1 - safe) * bg) / safe, 0, 255)
    spill = (colour[..., 0] > colour[..., 1] + 40) & (colour[..., 2] > colour[..., 1] + 40)
    colour[spill] = colour[spill] * 0.5 + colour[spill].mean(axis=1, keepdims=True) * 0.5
    rgba = np.dstack([colour, alpha * 255]).astype(np.uint8)
    ys, xs = np.nonzero(alpha > 0.1)
    return Image.fromarray(rgba).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def main():
    out, columns, items = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
    rows = (len(items) + columns - 1) // columns
    atlas = Image.new("RGBA", (CELL * columns, CELL * rows), (0, 0, 0, 0))
    metrics = {}
    for i, item in enumerate(items):
        name, path = item.split("=", 1)
        sprite = key(path)
        scale = min(CELL * FILL / sprite.width, CELL * FILL / sprite.height)
        sprite = sprite.resize(
            (round(sprite.width * scale), round(sprite.height * scale)), Image.LANCZOS
        )
        x = (i % columns) * CELL + (CELL - sprite.width) // 2
        y = (i // columns) * CELL + (CELL - sprite.height) // 2
        atlas.alpha_composite(sprite, (x, y))
        metrics[name] = {
            "cell": i,
            "width": round(sprite.width / CELL, 3),
            "height": round(sprite.height / CELL, 3),
        }
    atlas.save(out, optimize=True)
    print(json.dumps(metrics, indent=1))


if __name__ == "__main__":
    main()
