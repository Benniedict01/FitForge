export type RawRgbImage = {
  data: Uint8Array;
  width: number;
  height: number;
  channels: number;
};

export type SquareHint = {
  square: string;
  activity: number;
  likelyPiece: boolean;
};

export type BoardDetection = {
  confidence: number;
  bounds: { x: number; y: number; width: number; height: number };
  squareSize: number;
  squareHints: SquareHint[];
};

type Candidate = { x: number; y: number; size: number; score: number; confidence: number };
type Color = [number, number, number];

function rgbAt(image: RawRgbImage, x: number, y: number): Color {
  const px = Math.max(0, Math.min(image.width - 1, Math.round(x)));
  const py = Math.max(0, Math.min(image.height - 1, Math.round(y)));
  const index = (py * image.width + px) * image.channels;
  return [image.data[index], image.data[index + 1], image.data[index + 2]];
}

function averageColors(colors: Color[]): Color {
  const sum: Color = [0, 0, 0];
  for (const color of colors) {
    sum[0] += color[0];
    sum[1] += color[1];
    sum[2] += color[2];
  }
  return [sum[0] / colors.length, sum[1] / colors.length, sum[2] / colors.length];
}

function colorDistance(a: Color, b: Color): number {
  return Math.sqrt(((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) / 3);
}

// Sample two corners rather than the centre: piece artwork is most likely to cover the middle of a square.
function sampleSquare(image: RawRgbImage, x: number, y: number, size: number): Color {
  return averageColors([
    rgbAt(image, x + size * 0.22, y + size * 0.22),
    rgbAt(image, x + size * 0.78, y + size * 0.78),
  ]);
}

function scoreCandidate(image: RawRgbImage, x: number, y: number, size: number): Candidate {
  const dark: Color[] = [];
  const light: Color[] = [];
  const cells: Color[] = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const color = sampleSquare(image, x + (col * size) / 8, y + (row * size) / 8, size / 8);
      cells.push(color);
      ((row + col) % 2 === 0 ? dark : light).push(color);
    }
  }
  const darkMean = averageColors(dark);
  const lightMean = averageColors(light);
  const separation = colorDistance(darkMean, lightMean);
  let within = 0;
  for (const color of dark) within += colorDistance(color, darkMean) ** 2;
  for (const color of light) within += colorDistance(color, lightMean) ** 2;
  const withinDeviation = Math.sqrt(within / 64);
  let neighborContrast = 0;
  let neighborCount = 0;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const index = row * 8 + col;
      if (col < 7) {
        neighborContrast += colorDistance(cells[index], cells[index + 1]);
        neighborCount += 1;
      }
      if (row < 7) {
        neighborContrast += colorDistance(cells[index], cells[index + 8]);
        neighborCount += 1;
      }
    }
  }
  const alternating = neighborContrast / Math.max(1, neighborCount);
  const contrastAgreement = Math.min(1, alternating / Math.max(1, separation * 0.75));
  const separationRatio = separation / (separation + withinDeviation + 8);
  const contrastConfidence = Math.max(0, Math.min(1, (separation - 8) / 52));
  const confidence = contrastConfidence * separationRatio * (0.68 + 0.32 * contrastAgreement);
  const sizeBias = 0.94 + 0.06 * Math.sqrt(size / Math.min(image.width, image.height));
  return { x, y, size, score: separation * separationRatio * (0.68 + 0.32 * contrastAgreement) * sizeBias, confidence };
}

function imageHasContrast(image: RawRgbImage): boolean {
  const points: Color[] = [];
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      points.push(rgbAt(image, (image.width * (x + 0.5)) / 8, (image.height * (y + 0.5)) / 8));
    }
  }
  const mean = averageColors(points);
  const variance = points.reduce((sum, color) => sum + colorDistance(color, mean), 0) / points.length;
  return variance > 1.5;
}

function searchBoard(image: RawRgbImage): Candidate | null {
  const maximum = Math.min(image.width, image.height);
  const minimum = Math.max(28, Math.floor(maximum * 0.13));
  if (maximum < minimum + 4) return null;
  let best: Candidate | null = null;
  let coarseSizeStep = 2;
  let coarsePositionStep = 4;

  for (let size = minimum; size <= maximum; ) {
    const positionStep = Math.max(4, Math.floor(size / 16));
    for (let y = 0; y <= image.height - size; y += positionStep) {
      for (let x = 0; x <= image.width - size; x += positionStep) {
        const candidate = scoreCandidate(image, x, y, size);
        if (!best || candidate.score > best.score) {
          best = candidate;
          coarseSizeStep = Math.max(2, Math.floor(size / 48));
          coarsePositionStep = positionStep;
        }
      }
    }
    size += Math.max(2, Math.floor(size / 48));
  }
  if (!best) return null;

  const coarse = best;
  let refined = best;
  const radius = Math.max(3, coarsePositionStep + 1);
  for (
    let size = Math.max(minimum, coarse.size - coarseSizeStep - 1);
    size <= Math.min(maximum, coarse.size + coarseSizeStep + 1);
    size += 1
  ) {
    for (let y = Math.max(0, coarse.y - radius); y <= Math.min(image.height - size, coarse.y + radius); y += 1) {
      for (let x = Math.max(0, coarse.x - radius); x <= Math.min(image.width - size, coarse.x + radius); x += 1) {
        const candidate = scoreCandidate(image, x, y, size);
        if (candidate.score > refined.score) refined = candidate;
      }
    }
  }
  return refined;
}

function squareActivity(image: RawRgbImage, x: number, y: number, cellSize: number): number {
  const startX = x + cellSize * 0.22;
  const startY = y + cellSize * 0.22;
  const endX = x + cellSize * 0.78;
  const endY = y + cellSize * 0.78;
  let total = 0;
  let count = 0;
  const columns = 10;
  const rows = 10;
  let previousRow: Color[] = [];
  for (let row = 0; row < rows; row += 1) {
    const currentRow: Color[] = [];
    for (let col = 0; col < columns; col += 1) {
      const sx = startX + ((endX - startX) * col) / (columns - 1);
      const sy = startY + ((endY - startY) * row) / (rows - 1);
      const color = rgbAt(image, sx, sy);
      currentRow.push(color);
      if (col > 0) {
        total += colorDistance(color, currentRow[col - 1]);
        count += 1;
      }
      if (row > 0) {
        total += colorDistance(color, previousRow[col]);
        count += 1;
      }
    }
    previousRow = currentRow;
  }
  return count ? total / count : 0;
}

const FILES = "abcdefgh";

function boundedImage(image: RawRgbImage, maxDimension = 256): RawRgbImage {
  const largest = Math.max(image.width, image.height);
  if (largest <= maxDimension) return image;
  const scale = maxDimension / largest;
  const width = Math.max(64, Math.round(image.width * scale));
  const height = Math.max(64, Math.round(image.height * scale));
  const data = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.min(image.width - 1, Math.floor((x + 0.5) / scale));
      const sourceY = Math.min(image.height - 1, Math.floor((y + 0.5) / scale));
      const sourceIndex = (sourceY * image.width + sourceX) * image.channels;
      const targetIndex = (y * width + x) * 3;
      data[targetIndex] = image.data[sourceIndex];
      data[targetIndex + 1] = image.data[sourceIndex + 1];
      data[targetIndex + 2] = image.data[sourceIndex + 2];
    }
  }
  return { data, width, height, channels: 3 };
}

export function detectChessboard(image: RawRgbImage): BoardDetection | null {
  if (
    image.width < 64 ||
    image.height < 64 ||
    image.channels < 3 ||
    image.data.length < image.width * image.height * image.channels
  ) {
    return null;
  }
  const workingImage = boundedImage(image);
  if (!imageHasContrast(workingImage)) return null;
  const candidate = searchBoard(workingImage);
  if (!candidate || candidate.confidence < 0.12 || candidate.score < 9) return null;

  const cellSize = candidate.size / 8;
  const activity = Array.from({ length: 64 }, (_, index) => {
    const row = Math.floor(index / 8);
    const col = index % 8;
    return squareActivity(workingImage, candidate.x + col * cellSize, candidate.y + row * cellSize, cellSize);
  });
  const sorted = [...activity].sort((a, b) => a - b);
  const median = (sorted[31] + sorted[32]) / 2;
  const threshold = Math.max(2.7, median + 2.4, median * 1.42);
  const squareHints = activity.map((value, index) => {
    const row = Math.floor(index / 8);
    const col = index % 8;
    const activityScore = Math.round(Math.max(0, Math.min(1, value / Math.max(8, threshold * 2))) * 100) / 100;
    return {
      square: `${FILES[col]}${8 - row}`,
      activity: activityScore,
      likelyPiece: cellSize >= 8 && value > threshold,
    };
  });

  return {
    confidence: Math.round(candidate.confidence * 100) / 100,
    bounds: {
      x: Math.round((candidate.x / workingImage.width) * 10000) / 10000,
      y: Math.round((candidate.y / workingImage.height) * 10000) / 10000,
      width: Math.round((candidate.size / workingImage.width) * 10000) / 10000,
      height: Math.round((candidate.size / workingImage.height) * 10000) / 10000,
    },
    squareSize: Math.round((candidate.size / 8) * 100) / 100,
    squareHints,
  };
}
