"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Trash2, TrendingUp } from "lucide-react";
import { clearHistory, loadHistory, type HistoryEntry } from "@/lib/chess/history";

export function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEntries(loadHistory());
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function deleteAll() {
    clearHistory();
    setEntries([]);
    setCleared(true);
  }

  return (
    <main id="main-content" className="page-width content-page history-page">
      <div className="content-heading-row"><div><p className="eyebrow"><span /> YOUR RECENT POSITIONS</p><h1>Analysis <em>history.</em></h1><p>Stored only in this browser. Screenshots are never included.</p></div>{entries.length > 0 && <button className="button button-outline button-small danger-button" type="button" onClick={deleteAll}><Trash2 size={14} /> Delete history</button>}</div>
      {!ready ? <div className="history-loading"><span className="loading-dot" /> Loading local history…</div> : entries.length === 0 ? <section className="empty-state-card history-empty"><span className="history-empty-icon"><Clock3 size={20} /></span><h2>{cleared ? "History cleared." : "No saved analyses yet."}</h2><p>{cleared ? "The saved FENs and move details have been removed from this browser." : "Run a Stockfish analysis to save its FEN, move, evaluation, and depth here."}</p><Link className="button button-primary" href="/analyze">Start an analysis <ArrowRight size={15} /></Link></section> : <section className="history-list" aria-label="Saved analyses">{entries.map((entry) => <article className="history-card" key={entry.id}><div className="history-card-top"><span><Clock3 size={13} /> {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.analyzedAt))}</span><span className="depth-badge">DEPTH {entry.depth}</span></div><div className="history-result"><div><span className="tiny-label">BEST MOVE</span><strong>{entry.bestMove}</strong><span>{entry.piece} · {entry.from} → {entry.to}</span></div><div className="history-eval"><span className="tiny-label">WHITE EVAL</span><strong>{entry.evaluation}</strong></div></div><div className="history-card-bottom"><code>{entry.fen}</code><Link href={`/analyze?fen=${encodeURIComponent(entry.fen)}`} className="text-link">Open position <ArrowRight size={14} /></Link></div></article>)}</section>}
      <div className="history-privacy"><TrendingUp size={15} /><p>History contains no image, account, or cloud sync. Clear it here or in <Link href="/settings">Settings</Link>.</p></div>
    </main>
  );
}
