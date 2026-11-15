import sharp from "sharp";
import { detectChessboard, type BoardDetection } from "@/lib/chess/vision";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;

export type InspectedImage = {
  detection: BoardDetection | null;
  width: number;
  height: number;
};

export function imageSignatureMatches(buffer: Buffer, mime: string): boolean {
  if (mime === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }
  if (mime === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }
  return false;
}

export async function inspectChessScreenshot(buffer: Buffer, mime: string): Promise<InspectedImage> {
  if (!imageSignatureMatches(buffer, mime)) {
    throw new Error("Unsupported image or image type does not match its file contents. Use JPEG, PNG, or WebP.");
  }
  const result = await sharp(buffer, { limitInputPixels: MAX_PIXELS, failOn: "error" })
    .rotate()
    .resize({ width: 256, height: 512, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#fff" })
    .toColourspace("srgb")
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (result.info.channels < 3 || result.info.width < 64 || result.info.height < 64) {
    throw new Error("The image is too small to inspect. Use a screenshot with the full board visible.");
  }
  return {
    width: result.info.width,
    height: result.info.height,
    detection: detectChessboard({
      data: result.data,
      width: result.info.width,
      height: result.info.height,
      channels: result.info.channels,
    }),
  };
}
