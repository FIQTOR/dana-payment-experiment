import crypto from 'node:crypto';

/**
 * Minimal, dependency-free QR-code-ish "visual code" generator.
 *
 * NOTE: This is NOT a fully spec-compliant QR encoder. It deterministically
 * renders a scannable-looking matrix from the input string so the experimental
 * UI can display a placeholder code without pulling a heavy dependency.
 * For real QR generation use the `qrcode` npm package.
 */
export function generateQrMatrix(text, size = 25) {
  const hash = crypto.createHash('sha256').update(text).digest();
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));

  // Fill with pseudo-random bits derived from the hash (expanded via repeated hash).
  let bytes = Buffer.from(hash);
  let idx = 0;
  const nextBit = () => {
    if (idx >= bytes.length * 8) {
      bytes = crypto.createHash('sha256').update(bytes).digest();
      idx = 0;
    }
    const bit = (bytes[idx >> 3] >> (7 - (idx & 7))) & 1;
    idx += 1;
    return bit;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      matrix[y][x] = nextBit();
    }
  }

  // Draw three finder patterns (position detection squares).
  const drawFinder = (ox, oy) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6;
        const center = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        if (ox + x < size && oy + y < size) matrix[oy + y][ox + x] = edge || center ? 1 : 0;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  return matrix;
}

/** Render the matrix to an SVG string. */
export function matrixToSvg(matrix, { moduleSize = 10, quiet = 4, color = '#111827', bg = '#ffffff' } = {}) {
  const n = matrix.length;
  const dim = (n + quiet * 2) * moduleSize;
  const rects = [];

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (matrix[y][x]) {
        rects.push(
          `<rect x="${(x + quiet) * moduleSize}" y="${(y + quiet) * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="${color}"/>`,
        );
      }
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}" viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges">` +
    `<rect width="${dim}" height="${dim}" fill="${bg}"/>` +
    rects.join('') +
    `</svg>`
  );
}
