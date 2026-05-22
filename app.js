// ─────────────────────────────────────────────────────────────────────────────
//  Palette Picker
//  Upload an image → extract its dominant colours → click any swatch to copy.
// ─────────────────────────────────────────────────────────────────────────────


// ─── DOM REFERENCES ───────────────────────────────────────────────────────────
// We grab the HTML elements we need and store them in variables.
// document.getElementById() finds an element by its id="..." attribute.

const dropZone  = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const result    = document.getElementById('result');
const preview   = document.getElementById('preview');
const palette   = document.getElementById('palette');


// ─── CLICK TO BROWSE ──────────────────────────────────────────────────────────
// Clicking the drop zone triggers a click on the hidden file input,
// which opens the system file picker dialog.

dropZone.addEventListener('click', () => fileInput.click());


// ─── DRAG & DROP ──────────────────────────────────────────────────────────────
// The browser fires these events automatically when you drag a file over the page.

dropZone.addEventListener('dragover', e => {
  e.preventDefault(); // Without this the browser would try to open the file itself
  dropZone.classList.add('drag-over'); // Triggers the hover style in CSS
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0]; // Grab the first dropped file
  if (file && file.type.startsWith('image/')) loadImage(file);
});


// ─── FILE INPUT (the "browse" link) ───────────────────────────────────────────
// Fires when the user selects a file through the system dialog.

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) loadImage(file);
});


// ─── LOAD IMAGE ───────────────────────────────────────────────────────────────
// FileReader reads a file from the user's computer and converts it to a URL
// (a long base64 string) that we can use as the src of an <img> element.

function loadImage(file) {
  const reader = new FileReader();

  reader.onload = e => {
    // Create a temporary Image object — like an invisible <img> in memory
    const img = new Image();

    img.onload = () => {
      // Show the image preview on the page
      preview.src = e.target.result;
      dropZone.hidden = true;
      result.hidden   = false;

      // Extract colours and build the palette
      const colors = extractColors(img);
      showPalette(colors);
    };

    img.src = e.target.result;
  };

  reader.readAsDataURL(file); // Start reading — triggers reader.onload when done
}


// ─── EXTRACT COLOURS ──────────────────────────────────────────────────────────
// This is the core of the app. The steps:
//   1. Draw the image onto a small hidden canvas
//   2. Read every pixel as raw numbers
//   3. Tally which colours appear most
//   4. Return the most frequent distinct colours

function extractColors(img, count = 6) {

  // Step 1 — Draw to a 100×100 canvas.
  // Shrinking the image blends nearby pixels together,
  // which actually helps us get cleaner colour results.
  const canvas = document.createElement('canvas');
  canvas.width  = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, 100, 100);

  // Step 2 — Read pixel data.
  // getImageData returns a flat array: [R, G, B, A, R, G, B, A, ...]
  // Each pixel takes up 4 slots. So pixel 0 is at index 0–3, pixel 1 is at 4–7, etc.
  const data = ctx.getImageData(0, 0, 100, 100).data;

  // Step 3 — Tally colours.
  // We "quantize" (round) each channel to reduce the number of unique shades.
  // Without this, rgb(255,0,0) and rgb(253,1,2) would be counted separately.
  const tally = {};

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 128) continue; // Skip transparent pixels

    // Round each channel to the nearest multiple of 32.
    // Math.min(255, ...) clamps the value so it never exceeds 255.
    const qr = Math.min(255, Math.round(r / 32) * 32);
    const qg = Math.min(255, Math.round(g / 32) * 32);
    const qb = Math.min(255, Math.round(b / 32) * 32);

    const key = `${qr},${qg},${qb}`;
    tally[key] = (tally[key] || 0) + 1; // Add 1, or start at 1 if first time we see this colour
  }

  // Step 4 — Sort by frequency, most common first.
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);

  // Step 5 — Greedily pick colours that are visually distinct from each other.
  // We go through the sorted list and skip any colour that looks too similar
  // to one we've already picked. This prevents getting 6 shades of the same blue.
  const picked = [];

  for (const [key] of sorted) {
    if (picked.length >= count) break;

    const [r, g, b] = key.split(',').map(Number);
    const hex = toHex(r, g, b);

    const tooSimilar = picked.some(existing => colorDistance(hex, existing) < 80);
    if (!tooSimilar) picked.push(hex);
  }

  return picked;
}


// ─── SHOW PALETTE ─────────────────────────────────────────────────────────────
// Build a coloured swatch element for each colour and add it to the page.

function showPalette(colors) {
  palette.innerHTML = ''; // Clear any previous result

  for (const hex of colors) {
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.backgroundColor = hex;

    const label = document.createElement('span');
    label.className = 'swatch__label';
    label.textContent = hex;

    swatch.appendChild(label);

    // Clicking a swatch copies its hex code to the clipboard
    swatch.addEventListener('click', () => copyHex(hex, label));

    palette.appendChild(swatch);
  }
}


// ─── COPY TO CLIPBOARD ────────────────────────────────────────────────────────

function copyHex(hex, label) {
  navigator.clipboard.writeText(hex).then(() => {
    label.textContent = 'Copied!';
    setTimeout(() => { label.textContent = hex; }, 1500); // Reset after 1.5s
  });
}


// ─── RESET BUTTON ─────────────────────────────────────────────────────────────

document.getElementById('resetBtn').addEventListener('click', () => {
  result.hidden   = true;
  dropZone.hidden = false;
  fileInput.value = ''; // Clear so the same file can be selected again
  palette.innerHTML = '';
});


// ─── COLOUR HELPERS ───────────────────────────────────────────────────────────

// Convert three 0–255 numbers to a hex colour string like "#ff0000"
function toHex(r, g, b) {
  return '#' + [r, g, b]
    .map(v => v.toString(16).padStart(2, '0')) // e.g. 255 → "ff", 10 → "0a"
    .join('');
}

// How "far apart" are two colours visually?
// We use the same formula as physical distance (Pythagoras), but in 3D colour space.
// Max possible distance: sqrt(255² + 255² + 255²) ≈ 441
function colorDistance(hex1, hex2) {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

// Parse "#rrggbb" into [r, g, b] numbers
function hexToRgb(hex) {
  const m = hex.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}
