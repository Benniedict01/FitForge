# ChessVision AI

A mobile-first chess screenshot review and Stockfish analysis app built with **Next.js 16, React 19, TypeScript, chess.js, Sharp, an experimental Fenshot/ONNX vision model, local Tesseract.js OCR, and Stockfish 19 Lite WebAssembly**.

> **Recognition limitation, stated plainly:** screenshot recognition is experimental and not broadly benchmarked. The API proposes board pieces and may infer orientation or side to move, but model confidence is not accuracy; a single Chess.com fixture worked locally while a generated starting-board image produced a poor prediction. Every image-only request returns `needs_review` and **never starts Stockfish**. Compare all 64 squares and verify side to move, castling rights, en-passant, and counters before confirming. Still images cannot prove castling history or general move history; uncertain squares are marked `?`. The model runs on the server and no external recognition API is called.

## Run locally

Requirements: **Node.js 22.12+** and npm. No API keys, database, or paid service are required.

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>. The dev server binds to `0.0.0.0` for hosted previews.

For production:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

The app requires a **Node.js server runtime**. It is not a static export: the analysis route starts the bundled Stockfish WASM process. The included `Dockerfile` is a small deployment starting point. Use a Node-capable host that permits this route to launch a child process and allows at least 30 seconds for a deep search.

## Environment variables

No environment variables are required. Optional:

```dotenv
# Used only for canonical Open Graph metadata; it is public, not a secret.
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

There are no AI keys and no external image-recognition service. Do not put secrets in frontend variables.

## What works

- Landing page, responsive analysis workspace, settings, local analysis history, and iPhone Shortcut setup guide.
- JPEG / PNG / WebP uploads, drag-and-drop, a 10 MB request limit, 40 MP decoded-image cap, EXIF orientation correction, and file-signature validation.
- Local image preprocessing with Sharp, the experimental Fenshot ONNX board/piece classifier, and optional local Tesseract.js OCR. The image route returns board bounds, a candidate placement, per-square confidence, state-cue warnings, and sometimes a candidate FEN; it always requires review and never starts Stockfish.
- A visual screenshot preview with candidate board bounds, prefilled recognized pieces, low-confidence `?` markers, White/Black-bottom orientation, manual piece placement, side-to-move selection, castling-right controls, en-passant input, and full FEN import/export.
- chess.js FEN validation and legal move / SAN validation. Invalid or incomplete positions cannot reach Stockfish. Side to move may have visual or positional cues, but castling history and general move history are not recoverable from a still board and require review.
- **Stockfish 19 Lite single-threaded WASM**, run through UCI in the Node.js API. It calculates a best move, up to three alternative lines, evaluation from White's perspective, principal variation, and searched depth. Depths 10 / 14 / 18 are available in the UI; the API accepts depths 8–18.
- Checkmate, stalemate, draw, timeout, invalid-FEN, unsupported-image, no-board, and engine failure states.
- Mobile-friendly board controls, move arrow / square highlights, best-move preview, alternatives, principal variation, and device-local history. History contains FEN / engine output only; users can delete it in Settings.
- No stealth, screen scraping, or automated interaction with chess websites.

### Computer-vision boundaries

The image path uses [`@scoriiu/fenshot`](https://github.com/scoriiu/fenshot) and its bundled ONNX tile classifier, with local Tesseract.js used only as optional text evidence. The package/model is declared MIT upstream, but training-data provenance has not been independently reviewed. Upstream coverage claims are not a benchmark. Only one Chess.com fixture was successfully processed locally and not compared against its labels; a generated starting-board image was misclassified. Do not assume accuracy across sites, themes, custom pieces, overlays, or rotated/partial boards.

ChessVision therefore:

1. normalizes and inspects the image in memory;
2. proposes piece identities for all 64 squares and reports confidence per square (confidence is not a probability of correctness);
3. marks low-confidence cells `?`, and tries conservative orientation / turn cues, with visible warnings when those are unavailable or conflict;
4. requires the user to compare the whole board and game-state fields, explicitly acknowledge review, and pass legal-position validation;
5. sends only the confirmed FEN to Stockfish. Image-only API requests never invoke the engine and never return a best move.

A still board cannot establish castling history or general move counters. En-passant can be inferred only from a possible last-move highlight, and that heuristic is not guaranteed. When orientation is ambiguous (especially in pawnless positions), turn evidence conflicts, the prediction is implausible, or square confidence is low, correct the candidate in the editor or paste a trusted FEN. A FEN import is the fastest route when a trusted FEN is already available.

## Project map

```text
src/app/
  page.tsx                     Landing page
  analyze/page.tsx             Screenshot + position editor + results
  settings/page.tsx            Engine depth and local-data controls
  history/page.tsx             Browser-local saved analyses
  shortcuts/page.tsx           iPhone setup instructions
  api/analyze/route.ts         Multipart image and JSON FEN API
  globals.css                  Responsive dark design system
src/components/
  header.tsx / footer.tsx
  chess/analysis-workspace.tsx  Upload, board editor, engine result
  chess/board.tsx               Editable / result chessboard
src/lib/
  chess/position.ts             FEN, board mapping, legal-position guards
  chess/vision.ts               Legacy checkerboard and square cues
  chess/screenshot-state.ts     Orientation / turn cues and placement guards
  chess/samples.ts              Tested sample positions
  chess/history.ts              Versioned localStorage history
  server/image-recognition.ts   Sharp, ONNX classifier, optional OCR, warnings
  server/stockfish.ts           UCI process, MultiPV and score formatting
  server/rate-limit.ts          Bounded per-process request limiter
tests/
  api.test.ts                   Multipart and FEN endpoint tests
  vision.test.ts                Synthetic-board and blank-image tests
  engine.test.ts                Real Stockfish WASM MultiPV test
  position.test.ts              FEN and legality tests
tests/e2e/
  app.spec.ts                    Landing, sample engine, and mobile checks
public/engine/
  stockfish-19-lite-single.js    Stockfish 19 Lite single-threaded WASM glue
  stockfish-19-lite-single.wasm  ~1.8 MB engine module
licenses/
  Stockfish-GPL-3.0.txt          Stockfish GPLv3 license text
```

## Sample positions

The landing page and workspace include three valid FEN samples:

- **Starting position** — engine / notation baseline.
- **Mate in one** — White has a forced finish; Stockfish should return a mate score.
- **Pawn endgame** — sparse position for endgame analysis.

The engine calculates each result at runtime. Samples are not canned move outputs.

## API reference

### `POST /api/analyze`

Accepts **either** JSON containing a full FEN, or `multipart/form-data` containing an image (optionally a FEN).

#### JSON position request

```http
POST /api/analyze
Content-Type: application/json

{"fen":"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1","depth":14}
```

`fen` is required; `depth` is an integer from 8 to 18 (default 14). A successful non-terminal position returns fields including:

```json
{
  "success": true,
  "status": "analyzed",
  "fen": "<canonical validated FEN>",
  "bestMove": "<Stockfish SAN>",
  "uci": "<Stockfish UCI move>",
  "piece": "<piece at the source square>",
  "from": "<source square>",
  "to": "<destination square>",
  "evaluation": "<White-perspective score>",
  "principalVariation": ["<SAN move>", "..."],
  "alternatives": ["<up to three ranked engine lines>"],
  "depth": 14,
  "engine": "Stockfish 19 Lite WASM"
}
```

The response includes actual values computed for the submitted FEN. It is not cached. Terminal positions return `status: "finished"` and no move. Invalid positions return HTTP 400. If Stockfish fails or times out, the API returns an error and no move.

#### Screenshot upload

```bash
curl -X POST "https://your-domain.example/api/analyze" \
  -F "image=@board-screenshot.jpg" \
  -F "depth=14"
```

Multipart image field name: `image`. Supported formats: `image/jpeg`, `image/png`, `image/webp`. Maximum upload: **10 MB**. HEIC must be exported / converted to JPEG by the Shortcut. When a board is found, the response has `success: true`, `status: "needs_review"`, `requiresReview: true`, normalized board bounds, a candidate piece placement, per-square confidence, warnings, and possibly a candidate `fen`. `bestMove` is always `null` for image-only requests; the image route never invokes Stockfish. If no board is found, the response is HTTP 422. The service does not retain the uploaded bytes. Confidence scores describe model certainty, not recognition accuracy.

To analyze a reviewed screenshot position in the same API, submit its complete FEN as JSON. A multipart form may also contain both `image` and `fen`; when `fen` is present it is validated and analyzed.

#### Errors / limits

- 400 — malformed JSON, bad depth, or invalid FEN
- 413 — body larger than the request cap
- 415 — unsupported media type / image format
- 422 — no clear board found in an image
- 429 — per-process request limit (20 requests per IP per minute)
- 503 — local vision model initialization or Stockfish initialization, timeout, or engine result failure

The limiter is deliberately dependency-free and **per process / best effort**. For a public multi-instance deployment, configure a shared edge/Redis rate limit and trusted proxy IP handling. Public endpoints can be abused; use host-level abuse controls appropriate to your deployment.

## iPhone Shortcuts

The website does not install a Shortcut or independently monitor screenshots. iOS versions and device configurations may expose different automation triggers; the automatic workflow below is conditional, not a guaranteed iPhone feature.

### Screenshot automation (where available)

1. In Shortcuts, open **Automation → New Automation** and check whether your device offers a screenshot-related trigger. Follow only the options displayed by your iOS version; no minimum version is claimed here.
2. If the trigger runs after a screenshot but does not supply its image, use **Find Photos** filtered to screenshots, newest first, limit one. Verify that this selects the intended image before automating uploads.
3. Pass the image to **Get Contents of URL**. Set URL to `https://your-domain.example/api/analyze`, Method **POST**, Request Body **Form**. Add `image` = screenshot input, and `depth` = `14`.
4. Show the response with **Show Result** or a notification. For an image-only upload, ChessVision returns `needs_review`, not a move. Continue in the web editor to confirm the position. If no suitable trigger is shown, use the Share Sheet workflow below.

### Share Sheet fallback (manual and broadly compatible)

1. Create a Shortcut named **ChessVision — Analyze Image**.
2. Open its details, enable **Show in Share Sheet**, and accept Images.
3. Add **Get Contents of URL** for the endpoint above; set Method **POST**, Request Body **Form**, `image` = Shortcut Input, `depth` = `14`.
4. Add **Show Result**. For a polished result, check the JSON `status`: show `bestMove` and `evaluation` only for `analyzed`; otherwise show the API `message`.
5. In Photos, share a chess screenshot to the Shortcut. If iOS shares HEIC, add **Convert Image → JPEG** before upload.

For an immediate best-move response from a Shortcut, it must send a **complete reviewed FEN** using a JSON request rather than an image-only request. A FEN request can be made with **Get Contents of URL**, Method **POST**, Request Body **JSON**, keys `fen` and `depth`. Keep personal tokens out of shortcuts; this API needs no secret by default. Use HTTPS on a public deployment.

## Deployment

- Deploy to a Node.js host (Node 22.12+) with `child_process` enabled, file access to `public/engine`, and sufficient request timeout. Do not use static-only hosting.
- Preserve the `public/engine` Stockfish files and `licenses/Stockfish-GPL-3.0.txt` in the deploy.
- Run `npm ci && npm run build && npm start` or build the Docker image.
- No database is required. The image is not written to disk; browser history is localStorage.
- If terminating the app behind a reverse proxy, make sure it passes the true client IP safely; do not trust arbitrary forwarded IP headers.

### Stockfish license

The included Stockfish 19 Lite engine is distributed under **GPL-3.0**. The full license text is in `licenses/Stockfish-GPL-3.0.txt`. The engine JavaScript/WASM were taken from the `stockfish@19.0.1` release published by [nmrugg/stockfish.js](https://github.com/nmrugg/stockfish.js), based on [official Stockfish](https://github.com/official-stockfish/Stockfish). Source code and build details are available upstream; preserve the GPL notice and source offer when distributing the application. The rest of the project dependencies retain their own licenses.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The unit/API suite exercises FEN validation, low-confidence square handling, turn/orientation evidence, screenshot upload and recognition response shape, invalid images, real Stockfish WASM search, legal best moves, and MultiPV alternatives. The synthetic/API cases verify behavior and response structure, not recognition accuracy. Browser tests cover the landing-to-workspace flow, a real mate-in-one analysis, and mobile overflow. Run them with a local server and installed Playwright browsers:

```bash
npm run dev
npx playwright install chromium
npm run test:e2e
```
