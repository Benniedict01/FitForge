import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-width footer-inner">
        <Link href="/" className="footer-brand"><span aria-hidden="true">♞</span> ChessVision AI</Link>
        <p>Real Stockfish analysis. Screenshot positions are reviewed before a move is shown.</p>
        <div className="footer-links"><Link href="/shortcuts">iPhone setup</Link><Link href="/settings">Privacy & settings</Link></div>
      </div>
    </footer>
  );
}
