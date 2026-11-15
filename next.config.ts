import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["sharp", "onnxruntime-web", "tesseract.js"],
  transpilePackages: ["@scoriiu/fenshot"],
  outputFileTracingIncludes: {
    "/api/analyze": [
      "./public/engine/**/*",
      "./node_modules/@scoriiu/fenshot/model/**/*",
      "./node_modules/onnxruntime-web/dist/ort.wasm.min.js",
      "./node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm",
      "./node_modules/tesseract.js/**/*",
      "./node_modules/tesseract.js-core/**/*",
      "./node_modules/@tesseract.js-data/eng/4.0.0_best_int/**/*",
    ],
  },
  allowedDevOrigins: ["*.e2b.app"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
