import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, CircleAlert, Clipboard, ExternalLink, FileImage, KeyRound, Smartphone, Upload } from "lucide-react";

export const metadata: Metadata = { title: "iPhone Shortcut setup" };

const host = "https://your-deployment.example";

export default function ShortcutsPage() {
  return (
    <main id="main-content" className="page-width content-page shortcuts-page">
      <div className="shortcuts-hero"><div><p className="eyebrow"><span /> IPHONE INTEGRATION</p><h1>Shortcuts, with<br /><em>clear limits.</em></h1><p>ChessVision exposes a real multipart API. iOS can send screenshots with an automation or the Share Sheet; the website cannot install a Shortcut or watch your screen on its own.</p><div className="shortcuts-hero-links"><a href="https://support.apple.com/guide/shortcuts/welcome/ios" target="_blank" rel="noreferrer" className="text-link">Apple Shortcuts User Guide <ExternalLink size={14} /></a><Link href="/analyze" className="button button-primary">Open workspace <ArrowRight size={15} /></Link></div></div><div className="shortcut-api-card"><span className="api-card-top"><Smartphone size={16} /> SHORTCUT API</span><strong>POST</strong><code>/api/analyze</code><div><span className="api-dot" /> JSON + multipart image</div><div><span className="api-dot" /> No key required</div><div><span className="api-dot" /> No image retention</div></div></div>

      <section className="shortcut-notice"><CircleAlert size={18} /><div><strong>Experimental recognition; review is mandatory</strong><p>The API uses an experimental local piece classifier and may infer orientation or turn, but it is not broadly benchmarked and confidence is not accuracy. Every image-only request returns <code>needs_review</code> with a candidate board/FEN when available; it never calls Stockfish. Compare all squares and verify side to move, castling rights, en-passant, and move history in the web editor before analysis.</p></div></section>

      <section className="shortcut-method-grid">
        <article className="shortcut-method"><div className="method-label"><span>01</span><span className="method-tag">Where available</span></div><h2>Screenshot automation</h2><p className="method-intro">Use this only if your iOS version offers a screenshot-related trigger in Shortcuts. Trigger availability and its inputs vary; ChessVision does not activate it for you.</p><ol className="instruction-list"><li><span>1</span><div>Open <strong>Shortcuts → Automation → New Automation</strong> and check whether a screenshot-related trigger is offered. Follow the options shown on your device; do not assume every iOS version exposes one.</div></li><li><span>2</span><div>Add the actions below (or create the share-sheet Shortcut in the next section, then call it from the automation). Keep the first run interactive and test with a disposable chess screenshot.</div></li><li><span>3</span><div>Pass the trigger’s image input to <strong>Get Contents of URL</strong>. If your iOS build doesn’t pass the image into the shortcut, add <strong>Find Photos</strong> filtered to screenshots, newest first, limit 1; use the result as the image.</div></li><li><span>4</span><div>Show the API response with <strong>Show Result</strong> or a notification. The expected response for an image alone is a review notice; there is no move until a reviewed FEN is supplied.</div></li></ol><div className="method-footnote"><Check size={14} /> If you don’t see a Screenshot trigger, use the Share Sheet workflow below. Don’t create a “when screenshot” trigger on an iOS release that doesn’t offer one.</div></article>

        <article className="shortcut-method"><div className="method-label"><span>02</span><span className="method-tag">Older iOS / manual</span></div><h2>Share Sheet workflow</h2><p className="method-intro">This is the reliable fallback for iOS versions without a screenshot trigger, and works on newer iOS too.</p><ol className="instruction-list"><li><span>1</span><div>Create a Shortcut named <strong>ChessVision — Analyze Image</strong>. Open its details, enable <strong>Show in Share Sheet</strong>, and accept images.</div></li><li><span>2</span><div>Add <strong>Get Contents of URL</strong>. Use your deployed address plus <code>/api/analyze</code>; set Method to <strong>POST</strong>, Request Body to <strong>Form</strong>, and add fields <code>image</code> = Shortcut Input and <code>depth</code> = <code>14</code>.</div></li><li><span>3</span><div>Add <strong>Show Result</strong> and pass in the response dictionary. For a nicer flow, get the <code>status</code> value: show <code>bestMove</code> and <code>evaluation</code> only when status is <code>analyzed</code>; otherwise show the returned <code>message</code>.</div></li><li><span>4</span><div>In Photos, tap a chess screenshot → <strong>Share</strong> → <strong>ChessVision — Analyze Image</strong>. The upload is processed and discarded; if a board is detected, continue in the web editor to confirm the pieces.</div></li></ol><div className="method-footnote"><FileImage size={14} /> iOS may share HEIC by default. If so, add <strong>Convert Image → JPEG</strong> before the upload action.</div></article>
      </section>

      <section className="shortcut-api-docs"><div className="api-doc-heading"><div><p className="eyebrow"><span /> API REFERENCE</p><h2>One endpoint.<br /><em>Two inputs.</em></h2></div><p>Use multipart for screenshots, or JSON for a reviewed FEN. No external AI service is involved. All responses are <code>Cache-Control: no-store</code>.</p></div><div className="api-example-grid"><article><span className="api-example-label"><Upload size={14} /> IMAGE UPLOAD</span><pre>{`curl -X POST "${host}/api/analyze" \\
  -F "image=@board.jpg" \\
  -F "depth=14"`}</pre><p>Always returns <code>needs_review</code> for images, with board bounds, candidate placement, confidence, warnings, and sometimes a candidate FEN. It never returns a move from an image alone.</p></article><article><span className="api-example-label"><Clipboard size={14} /> REVIEWED FEN</span><pre>{`curl -X POST "${host}/api/analyze" \\
  -H "Content-Type: application/json" \\
  -d '{"fen":"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "depth":14}'`}</pre><p>Returns the actual Stockfish move, UCI, evaluation, principal variation, and up to three alternatives.</p></article></div><div className="api-response-note"><KeyRound size={15} /><p>No API key is required by default. The server applies a small per-process rate limit; add shared edge rate limiting or auth before a high-traffic public deployment.</p></div></section>

      <section className="shortcut-response"><div><p className="eyebrow"><span /> EXAMPLE RESPONSE</p><h2>Image-only response</h2><p>Even when the model produces a candidate FEN, the response stays at <code>needs_review</code> and never includes a move. This excerpt is illustrative, not an accuracy benchmark; the actual response also includes all 64 square confidences.</p></div><pre>{`{
  "success": true,
  "status": "needs_review",
  "requiresReview": true,
  "fen": "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
  "bestMove": null,
  "message": "The board and a candidate position were recognized. Review every square...",
  "recognition": {
    "model": "Fenshot chess-tiles-v2",
    "placement": "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R",
    "orientation": "white",
    "turn": "w",
    "turnSource": "Chess.com engine variation",
    "castling": "KQkq",
    "enPassant": "-",
    "confidence": { "mean": 0.955, "minimum": 0.764, "threshold": 0.7 },
    "ready": true,
    "warnings": [
      { "code": "CASTLING_INFERRED", "message": "A still image cannot prove castling history." },
      { "code": "HISTORY_UNAVAILABLE", "message": "No last-move cue was available." }
    ],
    "fen": "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1"
  },
  "privacy": { "retained": false }
}`}</pre></section>

      <section className="shortcut-cta"><div><p className="eyebrow"><span /> READY TO REVIEW A POSITION?</p><h2>Correct the board once.<br /><em>Get real engine lines.</em></h2></div><Link className="button button-primary button-large" href="/analyze">Open ChessVision <ArrowRight size={16} /></Link></section>
    </main>
  );
}
