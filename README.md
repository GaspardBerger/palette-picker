# Palette Picker

Upload any image and instantly extract its dominant colours as copyable hex codes.

**[→ Live demo](https://gaspardberger.github.io/palette-picker)**

![Palette Picker](screenshot.png)

## How to use

1. Drop an image onto the page, or click **browse your files**
2. Six dominant colours are extracted and displayed as swatches
3. Click any swatch to copy its hex code to your clipboard

## How it works

The app draws your image onto a hidden canvas resized to 100×100 pixels, reads every pixel's RGB values, groups similar colours together, and returns the most frequent distinct ones — all running locally in your browser. No file is ever uploaded anywhere.

## Built with

- Vanilla HTML, CSS & JavaScript — no libraries, no build tools
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) — for pixel-level image reading
- [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) — for one-click hex copying

## Run locally

Open `index.html` in any browser. That's it.
