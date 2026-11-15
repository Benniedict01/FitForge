import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronRight, CircleDot, Cpu, ScanLine, ShieldCheck, Smartphone, Sparkles, Swords, Upload } from "lucide-react";
import { boardFromFen, PIECE_GLYPHS, type PieceCode } from "@/lib/chess/position";
import { SAMPLE_POSITIONS, START_FEN } from "@/lib/chess/samples";

function HeroBoard() {
  const board = boardFromFen(START_FEN);
  return (
    <div className="hero-board-wrap" aria-label="Chess starting position illustration">
      <div className="hero-board-topline"><span className="live-indicator" /> LIVE POSITION REVIEW <span>WHITE TO MOVE</span></div>
      <div className="hero-board">
        {board.flatMap((row, rowIndex) => row.map((piece, colIndex) => (
          <div className={(rowIndex + colIndex) % 2 === 0 ? "hero-square hero-square-light" : "hero-square hero-square-dark"} key={`${rowIndex}-${colIndex}`}>
            {piece && <span className={piece === piece.toUpperCase() ? "mini-piece mini-white" : "mini-piece mini-black"}>{PIECE_GLYPHS[piece as PieceCode]}</span>}
            {rowIndex === 5 && colIndex === 4 && <span className="hero-best-square" />}
          </div>
        )))}
        <div className="hero-arrow" aria-hidden="true"><span>↗</span></div>
      </div>
      <div className="hero-analysis-card">
        <div><span className="tiny-label">ENGINE PICK</span><strong>Nf3</strong></div>
        <div className="hero-score"><span className="tiny-label">EVALUATION</span><strong>+0.3</strong></div>
        <span className="engine-chip"><span className="live-indicator" /> STOCKFISH 19</span>
      </div>
    </div>
  );
}

const features = [
  { icon: ScanLine, title: "Experimental board vision", text: "Proposes pieces on all 64 squares and flags low-confidence cells. Compare every square before analysis." },
  { icon: ShieldCheck, title: "No silent guesses", text: "Position details that pixels cannot prove stay editable. Illegal FENs are blocked before the engine runs." },
  { icon: Cpu, title: "Actual Stockfish", text: "Stockfish 19 Lite runs as WebAssembly on the server. Get a best move, three alternatives, evaluation and PV." },
  { icon: Smartphone, title: "Shortcut-ready API", text: "Multipart image upload returns a reviewable candidate; JSON FEN requests run Stockfish analysis." },
];

export default function HomePage() {
  return (
    <main id="main-content">
      <section className="hero-section page-width">
        <div className="hero-copy">
          <div className="eyebrow"><span /> THE BOARD, WITHOUT THE GUESSWORK</div>
          <h1>See the board.<br /><em>Find the move.</em></h1>
          <p className="hero-lede">Turn a chess screenshot into a position you can trust, then let Stockfish calculate the strongest continuation.</p>
          <div className="hero-actions">
            <Link href="/analyze" className="button button-primary button-large"><Upload size={17} /> Analyze a position <ArrowUpRight size={16} /></Link>
            <Link href="/analyze?sample=mate-in-one" className="text-link">Try the mate-in-one sample <ArrowRight size={15} /></Link>
          </div>
          <div className="hero-trust-row"><span><Check size={14} /> Real Stockfish engine</span><span><Check size={14} /> No API keys</span><span><Check size={14} /> Screenshots not stored</span></div>
        </div>
        <div className="hero-visual"><HeroBoard /><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /></div>
        <div className="hero-bottom-note"><span>01 / SCREENSHOT</span><ArrowDownRight size={16} /><span>02 / REVIEW</span><ArrowDownRight size={16} /><span>03 / ANALYZE</span></div>
      </section>

      <section className="ticker-band" aria-label="Engine features">
        <div className="page-width ticker-inner"><span>STOCKFISH 19 LITE</span><i /> <span>CHESS.JS LEGALITY</span><i /> <span>4-PV MULTILINE</span><i /> <span>ON-DEVICE HISTORY</span><i /> <span>NO SCREENSHOT RETENTION</span></div>
      </section>

      <section className="section-block page-width" id="how-it-works">
        <div className="section-heading"><div><p className="eyebrow"><span /> A CAREFUL THREE-STEP FLOW</p><h2>From image to <em>insight.</em></h2></div><p className="section-intro">ChessVision keeps the important part visible: the position must be right before an engine recommendation means anything.</p></div>
        <div className="steps-grid">
          <article className="step-card"><span className="step-number">01</span><span className="step-icon"><Upload size={18} /></span><h3>Bring the screenshot</h3><p>Drop an image, choose a file, or send it from an iPhone Shortcut. The board frame is detected and the image is discarded after processing.</p><Link href="/analyze" aria-label="Upload a screenshot">Start with an image <ChevronRight size={15} /></Link></article>
          <article className="step-card"><span className="step-number">02</span><span className="step-icon"><CircleDot size={18} /></span><h3>Review the position</h3><p>Confirm piece identities, orientation, side to move, castling rights and en-passant state. Uncertain squares stay highlighted.</p><Link href="/analyze" aria-label="Review a position">Open the board editor <ChevronRight size={15} /></Link></article>
          <article className="step-card"><span className="step-number">03</span><span className="step-icon"><Sparkles size={18} /></span><h3>Let Stockfish calculate</h3><p>Get a validated best move, alternatives, white-perspective evaluation and principal variation at the depth you choose.</p><Link href="/analyze?sample=opening" aria-label="Try Stockfish on a sample">Try a sample analysis <ChevronRight size={15} /></Link></article>
        </div>
      </section>

      <section className="feature-section">
        <div className="page-width feature-layout">
          <div className="feature-copy"><p className="eyebrow"><span /> BUILT FOR ACCURACY</p><h2>Confidence starts<br />with <em>the position.</em></h2><p>Chess screenshots don’t reveal every chess rule. We don’t pretend a visual guess is a complete FEN. Confirm the board once, and the engine works from a position that can be checked.</p><Link href="/shortcuts" className="button button-outline">How iPhone Shortcuts work <ArrowUpRight size={15} /></Link></div>
          <div className="feature-list">{features.map(({ icon: Icon, title, text }, index) => <article className="feature-row" key={title}><span className="feature-icon"><Icon size={18} /></span><div><span className="feature-index">0{index + 1}</span><h3>{title}</h3><p>{text}</p></div></article>)}</div>
        </div>
      </section>

      <section className="section-block page-width sample-section">
        <div className="section-heading"><div><p className="eyebrow"><span /> TRY THE ENGINE</p><h2>Choose a <em>position.</em></h2></div><p className="section-intro">These samples use real positions. Each result is calculated when you open the analysis workspace.</p></div>
        <div className="sample-grid">{SAMPLE_POSITIONS.map((sample, index) => <Link href={`/analyze?sample=${sample.id}`} className="sample-card" key={sample.id}><div className="sample-card-top"><span>{sample.tag}</span><span className="sample-index">0{index + 1}</span></div><h3>{sample.title}</h3><p>{sample.description}</p><span className="sample-open">Analyze position <ArrowRight size={15} /></span></Link>)}</div>
      </section>

      <section className="closing-cta page-width"><div className="closing-icon"><Swords size={21} /></div><div><p className="eyebrow"><span /> YOUR NEXT MOVE, MADE CLEAR</p><h2>Bring the position.<br /><em>We’ll bring the engine.</em></h2></div><Link href="/analyze" className="button button-primary button-large">Open analysis workspace <ArrowRight size={16} /></Link><span className="cta-glow" aria-hidden="true" /></section>

      <section className="privacy-note page-width"><ShieldCheck size={16} /><p><strong>Private by design.</strong> Screenshots are inspected in memory and not saved by the server. Your analysis history stores only FEN and move details in this browser.</p></section>
    </main>
  );
}
