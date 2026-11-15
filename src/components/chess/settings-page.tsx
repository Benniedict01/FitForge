"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Database, Gauge, ShieldCheck, Trash2 } from "lucide-react";
import { clearHistory, loadHistory } from "@/lib/chess/history";
import { readDepth, writeDepth, type AnalysisDepth } from "@/lib/chess/preferences";

export function SettingsPage() {
  const [depth, setDepth] = useState<AnalysisDepth>(14);
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDepth(readDepth());
      setCount(loadHistory().length);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function updateDepth(value: number) {
    const next = value as AnalysisDepth;
    setDepth(next);
    writeDepth(next);
    setMessage(`Default analysis depth set to ${next}.`);
  }

  function deleteHistory() {
    clearHistory();
    setCount(0);
    setMessage("Saved analysis history was deleted from this browser.");
  }

  return (
    <main id="main-content" className="page-width content-page settings-page">
      <div className="content-heading-row"><div><p className="eyebrow"><span /> PERSONAL PREFERENCES</p><h1>Settings & <em>privacy.</em></h1><p>Preferences and history stay in this browser. No account is required.</p></div></div>
      <div className="settings-layout">
        <section className="settings-card"><div className="settings-card-head"><span className="settings-icon"><Gauge size={18} /></span><div><h2>Default engine depth</h2><p>Choose how far Stockfish searches when you open the workspace.</p></div></div><div className="depth-choice-grid">{([10, 14, 18] as const).map((option) => <button type="button" key={option} className={depth === option ? "depth-choice selected" : "depth-choice"} onClick={() => updateDepth(option)}><span className="depth-choice-top">{option === 10 ? "QUICK" : option === 14 ? "BALANCED" : "DEEP"}{depth === option && <Check size={13} />}</span><strong>Depth {option}</strong><span>{option === 10 ? "Fast results" : option === 14 ? "Recommended" : "More search, more time"}</span></button>)}</div><div className="settings-inline-note"><Gauge size={14} /><span>Depth is a search limit, not a promise of playing strength. Stockfish Lite may take longer at depth 18.</span></div></section>
        <section className="settings-card"><div className="settings-card-head"><span className="settings-icon"><Database size={18} /></span><div><h2>Local analysis history</h2><p>{ready ? `${count} saved ${count === 1 ? "analysis" : "analyses"}` : "Checking browser storage…"}. History stores FEN and engine output only; no screenshots.</p></div></div><div className="settings-row"><span>Saved in this browser</span><Link href="/history" className="text-link">Open history <span aria-hidden="true">↗</span></Link></div><div className="settings-row settings-row-danger"><span><Trash2 size={14} /> Delete all saved analyses</span><button type="button" className="button button-outline button-small danger-button" onClick={deleteHistory} disabled={!ready || count === 0}>Delete history</button></div></section>
        <section className="settings-card privacy-settings"><div className="settings-card-head"><span className="settings-icon"><ShieldCheck size={18} /></span><div><h2>Privacy by default</h2><p>Your screenshot and position data are handled as deliberately as possible.</p></div></div><ul className="privacy-list"><li><Check size={14} /> Screenshots are decoded and inspected in memory; no file or image URL is persisted.</li><li><Check size={14} /> Browser history contains position FEN and engine result only.</li><li><Check size={14} /> Engine analysis is local to this app server. No paid AI API or external image service is used.</li><li><Check size={14} /> An iPhone Shortcut can call the API without an account. Public deployments should add a shared rate limiter or authentication at the edge.</li></ul></section>
      </div>
      {message && <p className="settings-feedback" role="status"><Check size={14} /> {message}</p>}
    </main>
  );
}
