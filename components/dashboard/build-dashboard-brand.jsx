"use client";
import { useState, useRef } from "react";
import {
  LayoutDashboard, ClipboardList, Clock, Truck, BarChart3,
  FileText, Settings, Bell, Search, Upload, X, Check,
  TrendingUp, TrendingDown, DollarSign, CheckCircle2,
  MoreHorizontal, Eye, Download, Plus, Zap, Shield,
  Globe, Package, Building2, Timer, SendHorizonal, Hourglass,
  ChevronDown, LogOut, HelpCircle
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   BRAND PALETTE
   #1D3F1F  — Forest Dark   → sidebar bg, headings, CTA bg
   #09B14B  — Vivid Green   → primary accent, buttons, highlights
   #C5D92D  — Lime          → secondary accent, badges, spark
   #F4F3EB  — Warm Cream    → main background, light surfaces
───────────────────────────────────────────────────────────────── */

const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body, #root {
      background: #F4F3EB;
      font-family: 'IBM Plex Sans Arabic', sans-serif;
      direction: rtl;
      color: #1D3F1F;
      min-height: 100vh;
    }

    :root {
      /* Brand */
      --forest:   #1D3F1F;
      --green:    #09B14B;
      --lime:     #C5D92D;
      --cream:    #F4F3EB;

      /* Derived */
      --forest-dim:   rgba(29,63,31,0.07);
      --forest-mid:   rgba(29,63,31,0.13);
      --green-dim:    rgba(9,177,75,0.1);
      --green-glow:   rgba(9,177,75,0.25);
      --lime-dim:     rgba(197,217,45,0.15);
      --lime-glow:    rgba(197,217,45,0.3);

      /* Surfaces */
      --bg0: #F4F3EB;
      --bg1: #FAFAF4;
      --bg2: #F0EFDF;
      --bg3: #E8E7D6;
      --sidebar-bg: #1D3F1F;
      --sidebar-hover: rgba(255,255,255,0.08);
      --sidebar-active: rgba(197,217,45,0.18);

      /* Borders */
      --bdr:  rgba(29,63,31,0.09);
      --bdr2: rgba(29,63,31,0.18);

      /* Text */
      --t1: #1D3F1F;
      --t2: #4A6B4C;
      --t3: #8AA68C;

      /* Status */
      --red:    #D93B3B;
      --red-dim: rgba(217,59,59,0.1);
      --orange: #E07B2A;
      --orange-dim: rgba(224,123,42,0.1);
      --blue:   #2A6EBF;
      --blue-dim: rgba(42,110,191,0.1);

      --sidebar: 256px;
    }

    ::-webkit-scrollbar { width: 3px; height: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--bdr2); border-radius: 3px; }

    .mono { font-family: 'Space Mono', monospace !important; }

    /* ── ANIMATIONS ── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes spinLoader { to { transform: rotate(360deg); } }
    @keyframes waitPulse  { 0%,100% { opacity:.45; } 50% { opacity:1; } }
    @keyframes pulseDot   {
      0%,100% { box-shadow: 0 0 0 0 rgba(217,59,59,.5); }
      50%     { box-shadow: 0 0 0 6px rgba(217,59,59,0); }
    }
    @keyframes pulseGreen {
      0%,100% { box-shadow: 0 0 0 0 rgba(9,177,75,.45); }
      50%     { box-shadow: 0 0 0 8px rgba(9,177,75,0); }
    }
    @keyframes shimmerBar {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .page-in  { animation: fadeUp .26s ease both; }
    .s1 { animation-delay:.05s; } .s2 { animation-delay:.1s; }
    .s3 { animation-delay:.15s; } .s4 { animation-delay:.2s; }

    /* ── SIDEBAR ── */
    .sidebar {
      position: fixed; right: 0; top: 0;
      width: var(--sidebar); height: 100vh;
      background: var(--sidebar-bg);
      display: flex; flex-direction: column; z-index: 200;
      overflow: hidden;
    }
    .logo-mark {
      font-family: 'Space Mono', monospace;
      font-size: 22px; font-weight: 700;
      color: #C5D92D; letter-spacing: 4px;
      text-shadow: 0 0 24px rgba(197,217,45,.4);
    }
    .logo-sub { font-size: 10px; color: rgba(255,255,255,.35); margin-top: 4px; }

    .nav-section-label {
      font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
      color: rgba(255,255,255,.25); padding: 14px 14px 4px;
    }
    .nav-link {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px; border-radius: 9px; cursor: pointer;
      color: rgba(255,255,255,.55); font-size: 13px;
      transition: all .14s; position: relative; user-select: none;
      margin-bottom: 1px;
    }
    .nav-link:hover  { background: var(--sidebar-hover); color: rgba(255,255,255,.9); }
    .nav-link.on     { background: var(--sidebar-active); color: #C5D92D; font-weight: 600; }
    .nav-link.on::after {
      content: ''; position: absolute; left: 0; top: 50%;
      transform: translateY(-50%); width: 3px; height: 56%;
      background: #C5D92D; border-radius: 0 3px 3px 0;
    }
    .nav-lbl { flex: 1; }
    .nav-pip {
      font-size: 10px; font-weight: 700;
      padding: 1px 7px; border-radius: 20px;
    }

    /* ── TOPBAR ── */
    .topbar {
      position: fixed; top: 0; right: var(--sidebar); left: 0; height: 56px;
      background: rgba(244,243,235,.92); backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--bdr);
      display: flex; align-items: center; padding: 0 24px; gap: 10px; z-index: 100;
    }

    /* ── CARDS ── */
    .card {
      background: var(--bg1); border: 1px solid var(--bdr);
      border-radius: 14px; overflow: hidden; transition: border-color .18s, box-shadow .18s;
    }
    .card:hover { border-color: var(--bdr2); }
    .card-head {
      padding: 15px 18px; border-bottom: 1px solid var(--bdr);
      display: flex; justify-content: space-between; align-items: center;
    }
    .card-title { font-size: 13px; font-weight: 600; color: var(--t1); }
    .card-body  { padding: 16px 18px; }

    /* ── STAT ── */
    .stat {
      background: var(--bg1); border: 1px solid var(--bdr); border-radius: 14px;
      padding: 18px; cursor: default; transition: all .2s; animation: fadeUp .4s ease both;
    }
    .stat:hover { border-color: var(--bdr2); transform: translateY(-2px); box-shadow: 0 6px 24px rgba(29,63,31,.07); }

    /* ── TABLE ── */
    .tbl { width: 100%; border-collapse: collapse; }
    .tbl th {
      text-align: right; font-size: 10px; color: var(--t3); font-weight: 600;
      padding: 9px 14px; border-bottom: 1px solid var(--bdr);
      letter-spacing: .7px; text-transform: uppercase;
    }
    .tbl td {
      padding: 13px 14px; border-bottom: 1px solid var(--bdr);
      font-size: 12.5px; vertical-align: middle;
    }
    .tbl tbody tr:last-child td { border-bottom: none; }
    .tbl tbody tr { cursor: pointer; transition: background .1s; }
    .tbl tbody tr:hover td { background: var(--forest-dim); }

    /* ── BADGE ── */
    .badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 20px; font-size: 10.5px; font-weight: 600;
    }
    .badge::before {
      content: ''; width: 5px; height: 5px; border-radius: 50%;
      background: currentColor; flex-shrink: 0;
    }

    /* ── MODAL ── */
    .overlay {
      position: fixed; inset: 0; background: rgba(29,63,31,.45); z-index: 500;
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(6px);
    }
    .modal-box {
      background: var(--bg1); border: 1px solid var(--bdr2); border-radius: 18px;
      width: 560px; max-width: 93vw; max-height: 88vh; overflow-y: auto;
      animation: fadeUp .22s ease; box-shadow: 0 24px 64px rgba(29,63,31,.22);
    }
    .modal-head {
      padding: 19px 22px; border-bottom: 1px solid var(--bdr);
      display: flex; justify-content: space-between; align-items: flex-start;
      position: sticky; top: 0; background: var(--bg1); z-index: 1;
    }

    /* ── FORM ── */
    .inp {
      background: var(--cream); border: 1.5px solid var(--bdr2); border-radius: 9px;
      padding: 10px 13px; color: var(--t1);
      font-family: 'IBM Plex Sans Arabic', sans-serif;
      font-size: 12.5px; outline: none; width: 100%; transition: border-color .14s;
    }
    .inp:focus { border-color: var(--green); box-shadow: 0 0 0 3px var(--green-dim); }
    .inp::placeholder { color: var(--t3); }
    select.inp { appearance: none; cursor: pointer; }
    textarea.inp { resize: vertical; }

    /* ── ICON BTN ── */
    .icon-btn {
      width: 34px; height: 34px; background: var(--bg2); border: 1px solid var(--bdr);
      border-radius: 8px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all .14s; color: var(--t2); flex-shrink: 0;
    }
    .icon-btn:hover { border-color: var(--bdr2); color: var(--t1); background: var(--bg3); }

    /* ── CHIP ── */
    .chip {
      padding: 5px 14px; border-radius: 20px; font-size: 11px; cursor: pointer;
      border: 1.5px solid var(--bdr2); background: var(--bg2); color: var(--t2);
      transition: all .14s; font-family: 'IBM Plex Sans Arabic', sans-serif;
    }
    .chip:hover, .chip.on {
      background: var(--green-dim); border-color: var(--green); color: var(--green);
    }

    /* ── PROGRESS ── */
    .prog-track { height: 6px; background: var(--bg3); border-radius: 3px; overflow: hidden; flex: 1; }
    .prog-fill  { height: 100%; border-radius: 3px; transition: width 1.1s cubic-bezier(.4,0,.2,1); }

    /* ── TIMELINE ── */
    .tl-done   { background: var(--green) !important; border-color: var(--green) !important; box-shadow: 0 0 10px var(--green-glow); }
    .tl-active { background: var(--lime)  !important; border-color: var(--lime)  !important; animation: pulseGreen 1.6s infinite; }
    .tl-idle   { background: var(--bg3)   !important; border-color: var(--bdr2)  !important; }

    /* ── NOTIF DOT ── */
    .n-dot {
      position: absolute; top: 5px; left: 5px; width: 7px; height: 7px;
      background: var(--red); border-radius: 50%; border: 1.5px solid var(--cream);
      animation: pulseDot 2s infinite;
    }

    /* ── TOAST ── */
    .toast {
      position: fixed; bottom: 22px; left: 22px; z-index: 1000;
      background: var(--forest); border-radius: 13px;
      padding: 13px 16px; display: flex; align-items: flex-start; gap: 12px;
      box-shadow: 0 20px 56px rgba(29,63,31,.35); animation: fadeUp .26s ease;
      min-width: 290px; max-width: 370px; color: #fff;
    }

    /* ── SUM ROW ── */
    .sum-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 9px 0; border-bottom: 1px solid var(--bdr); font-size: 12.5px;
    }
    .sum-row:last-child { border-bottom: none; font-weight: 700; font-size: 14px; }

    /* ── UPLOAD ZONE ── */
    .drop-zone {
      border: 2px dashed var(--bdr2); border-radius: 12px; padding: 34px;
      text-align: center; cursor: pointer; transition: all .2s;
    }
    .drop-zone:hover { border-color: var(--green); background: var(--green-dim); }

    /* ── QUOTE CARD ── */
    .quote-card {
      background: var(--bg2); border: 1.5px solid var(--bdr); border-radius: 13px;
      padding: 16px; margin-bottom: 10px; cursor: pointer; transition: all .2s;
    }
    .quote-card:hover { border-color: var(--green); box-shadow: 0 4px 16px var(--green-dim); }

    /* ── WAITING ── */
    .waiting-card {
      display: flex; align-items: center; gap: 13px; padding: 13px 14px;
      background: var(--bg2); border: 1px solid var(--bdr); border-radius: 12px;
      margin-bottom: 7px;
    }
    .spinner {
      width: 20px; height: 20px; border: 2.5px solid var(--bdr2);
      border-top-color: var(--green); border-radius: 50%;
      animation: spinLoader .85s linear infinite; flex-shrink: 0;
    }
    .waiting-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;
      background: var(--lime-dim); color: #5E6800;
      animation: waitPulse 2s ease infinite;
    }

    /* ── EMPTY ── */
    .empty { text-align: center; padding: 52px 20px; color: var(--t3); }

    /* ── DIVIDER ── */
    .divider { height: 1px; background: var(--bdr); margin: 12px 0; }

    /* ── USER CARD ── */
    .user-card {
      display: flex; align-items: center; gap: 10px; padding: 9px 12px;
      border-radius: 10px; cursor: pointer; transition: all .14s;
    }
    .user-card:hover { background: var(--sidebar-hover); }
  `}</style>
);

/* ─── BTN ─────────────────────────────────────────────────────── */
const Btn = ({ children, v = "primary", sm, onClick, disabled, style = {} }) => {
  const base = {
    padding: sm ? "5px 13px" : "9px 18px",
    fontSize: sm ? "11.5px" : "12.5px",
    fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    border: "none", borderRadius: "9px",
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
    transition: "all .15s", display: "inline-flex",
    alignItems: "center", gap: "6px",
    opacity: disabled ? .5 : 1,
  };
  const vs = {
    primary: { background: "#09B14B", color: "#fff",   boxShadow: "0 2px 12px rgba(9,177,75,.3)" },
    lime:    { background: "#C5D92D", color: "#1D3F1F", boxShadow: "0 2px 12px rgba(197,217,45,.3)" },
    ghost:   { background: "var(--bg2)", color: "var(--t1)", border: "1.5px solid var(--bdr2)" },
    danger:  { background: "var(--red-dim)", color: "var(--red)", border: "1px solid rgba(217,59,59,.25)" },
    outline: { background: "transparent", color: "#09B14B", border: "1.5px solid #09B14B" },
    forest:  { background: "#1D3F1F", color: "#C5D92D", boxShadow: "0 2px 12px rgba(29,63,31,.35)" },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...base, ...vs[v], ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = "brightness(1.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}>
      {children}
    </button>
  );
};

/* ─── BADGE ───────────────────────────────────────────────────── */
const STATUSES = {
  done:      { label: "مكتمل",               bg: "rgba(9,177,75,.12)",   c: "#09B14B" },
  shipping:  { label: "في الطريق",           bg: "rgba(42,110,191,.12)", c: "#2A6EBF" },
  pending:   { label: "بانتظار عرض السعر",   bg: "rgba(197,217,45,.2)",  c: "#5E6800" },
  quoted:    { label: "عرض وصلك ← راجعه",   bg: "rgba(9,177,75,.15)",   c: "#07823A" },
  cancelled: { label: "ملغي",                bg: "rgba(217,59,59,.1)",   c: "#D93B3B" },
  early:     { label: "مرحلة مبكرة",         bg: "rgba(29,63,31,.1)",    c: "#4A6B4C" },
};
const Badge = ({ status }) => {
  const s = STATUSES[status] || { label: status, bg: "var(--forest-dim)", c: "var(--t2)" };
  return <span className="badge" style={{ background: s.bg, color: s.c }}>{s.label}</span>;
};

/* ─── MODAL ───────────────────────────────────────────────────── */
const Modal = ({ open, onClose, title, sub, children, footer }) => {
  if (!open) return null;
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-head">
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--forest)" }}>{title}</div>
            {sub && <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 3 }}>{sub}</div>}
          </div>
          <button className="icon-btn" onClick={onClose}><X size={14} /></button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
        {footer && (
          <div style={{ padding: "14px 22px", borderTop: "1px solid var(--bdr)", display: "flex", gap: 8 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── TOAST ───────────────────────────────────────────────────── */
const Toast = ({ t, onDismiss }) => {
  if (!t) return null;
  return (
    <div className="toast">
      <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icon || "✅"}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{t.msg}</div>
        {t.sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", marginTop: 3 }}>{t.sub}</div>}
      </div>
      <div onClick={onDismiss} style={{ cursor: "pointer", color: "rgba(255,255,255,.4)", padding: 2 }}>
        <X size={13} />
      </div>
    </div>
  );
};

/* ─── PROGRESS ROW ────────────────────────────────────────────── */
const PRow = ({ label, pct, color = "var(--green)" }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
    <span style={{ minWidth: 92, fontSize: 11.5, color: "var(--t2)" }}>{label}</span>
    <div className="prog-track">
      <div className="prog-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
    <span className="mono" style={{ minWidth: 30, fontSize: 10.5, color: "var(--t2)", textAlign: "left" }}>{pct}%</span>
  </div>
);

/* ─── STAT CARD ───────────────────────────────────────────────── */
const Stat = ({ icon, label, value, trend, up, color, delay = 0 }) => (
  <div className="stat" style={{ animationDelay: `${delay}s` }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 11,
        background: color === "#09B14B" ? "var(--green-dim)" :
                    color === "#C5D92D" ? "var(--lime-dim)" :
                    color === "#1D3F1F" ? "var(--forest-dim)" : "var(--red-dim)",
        display: "flex", alignItems: "center", justifyContent: "center", color,
      }}>{icon}</div>
      <div style={{
        display: "flex", alignItems: "center", gap: 4, padding: "3px 9px",
        borderRadius: 20, fontSize: 11, fontWeight: 600,
        background: up === "n" ? "var(--forest-dim)"
                  : up ? "var(--green-dim)" : "var(--red-dim)",
        color: up === "n" ? "var(--t2)" : up ? "#09B14B" : "var(--red)",
      }}>
        {up === true  && <TrendingUp size={11} />}
        {up === false && <TrendingDown size={11} />}
        {trend}
      </div>
    </div>
    <div className="mono" style={{ fontSize: 27, fontWeight: 700, color: "var(--forest)", lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 11.5, color: "var(--t2)", marginTop: 5 }}>{label}</div>
    <div style={{ height: 3, background: "var(--bg3)", borderRadius: 2, marginTop: 14, overflow: "hidden" }}>
      <div style={{ height: "100%", width: "65%", background: color, borderRadius: 2, opacity: .7 }} />
    </div>
  </div>
);

/* ─── SPENDING CHART (SVG) ────────────────────────────────────── */
const CHART = [
  { m: "أكتوبر", v: 51 }, { m: "نوفمبر", v: 97 }, { m: "ديسمبر", v: 73 },
  { m: "يناير",  v: 108 }, { m: "فبراير", v: 78 },
];
const SpendChart = () => {
  const max = 120; const W = 480, H = 130, PW = 20;
  const bw = 50, gap = 14;
  const total = CHART.length * (bw + gap) - gap;
  const sx = (W - total) / 2;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 36}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#09B14B" stopOpacity=".85" />
          <stop offset="100%" stopColor="#07823A" stopOpacity=".65" />
        </linearGradient>
        <linearGradient id="gLime" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C5D92D" stopOpacity=".9" />
          <stop offset="100%" stopColor="#A0B020" stopOpacity=".7" />
        </linearGradient>
      </defs>
      {[0, .33, .66, 1].map((t, i) => (
        <line key={i} x1={PW} y1={PW + H * (1 - t)} x2={W - PW} y2={PW + H * (1 - t)}
          stroke="rgba(29,63,31,0.07)" strokeWidth={1} strokeDasharray="4 4" />
      ))}
      {[0, .33, .66, 1].map((t, i) => (
        <text key={i} x={PW - 4} y={PW + H * (1 - t) + 4}
          fill="var(--t3)" fontSize={9} textAnchor="end" fontFamily="Space Mono">
          {Math.round(max * t)}K
        </text>
      ))}
      {CHART.map((d, i) => {
        const x = sx + i * (bw + gap);
        const bh = (d.v / max) * (H - PW * .6);
        const isCur = i === 3;
        return (
          <g key={i}>
            <rect x={x} y={PW + H - PW * .6 - bh} width={bw} height={bh} rx={7}
              fill={isCur ? "url(#gBar)" : "rgba(9,177,75,0.15)"}
              style={{ transition: "opacity .2s", cursor: "pointer" }}
              onMouseEnter={e => e.target.style.opacity = .75}
              onMouseLeave={e => e.target.style.opacity = 1} />
            {isCur && (
              <>
                <rect x={x - 4} y={PW + H - PW * .6 - bh - 27} width={58} height={20}
                  rx={6} fill="#1D3F1F" />
                <text x={x + bw / 2} y={PW + H - PW * .6 - bh - 12}
                  fill="#C5D92D" fontSize={10} textAnchor="middle" fontFamily="Space Mono">
                  {d.v}K ر.س
                </text>
              </>
            )}
            <text x={x + bw / 2} y={PW + H + 14}
              fill={isCur ? "#09B14B" : "var(--t3)"}
              fontSize={9.5} textAnchor="middle" fontFamily="IBM Plex Sans Arabic"
              fontWeight={isCur ? 600 : 400}>
              {d.m}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ─── TIMELINE ────────────────────────────────────────────────── */
const Timeline = ({ steps }) => (
  <div style={{ padding: "6px 0" }}>
    {steps.map((s, i) => (
      <div key={i} style={{ display: "flex", gap: 13 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{
            width: 15, height: 15, borderRadius: "50%", border: "2px solid",
            flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          }} className={s.done ? "tl-done" : s.active ? "tl-active" : "tl-idle"}>
            {s.done && <Check size={9} color="#fff" />}
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: 2, flex: 1, minHeight: 26, borderRadius: 2,
              background: s.done ? "var(--green)" : "var(--bdr2)",
              margin: "3px 0", opacity: s.done ? .5 : 1,
            }} />
          )}
        </div>
        <div style={{ paddingBottom: i < steps.length - 1 ? 20 : 0 }}>
          <div style={{
            fontSize: 12.5, fontWeight: 600,
            color: s.active ? "#07823A" : s.done ? "var(--forest)" : "var(--t3)",
          }}>{s.label}</div>
          <div style={{ fontSize: 10.5, color: "var(--t3)", marginTop: 2 }}>{s.sub}</div>
        </div>
      </div>
    ))}
  </div>
);

/* ─── DATA ────────────────────────────────────────────────────── */
const REQUESTS = [
  { id: "#BLD-2024", product: "حديد تسليح T16",       specs: "SABIC · 40 طن",   project: "فيلا الرياض – قطعة 14",    value: "48,500", date: "15 فبراير", status: "done" },
  { id: "#BLD-2023", product: "دهانات خارجية",         specs: "500 لتر",          project: "مجمع الخبر السكني",         value: "12,200", date: "24 فبراير", status: "shipping" },
  { id: "#BLD-2022", product: "أنابيب PPR كلاس C",     specs: "Wavin · 200 م",   project: "برج جدة – الدور 12",        value: "31,750", date: "—",         status: "quoted" },
  { id: "#BLD-2021", product: "بلاط بورسلان 60×60",    specs: "RAK Ceramics",    project: "فيلا الرياض – قطعة 14",    value: "22,000", date: "10 فبراير", status: "done" },
  { id: "#BLD-2020", product: "كابلات كهربائية NYY",   specs: "4×10 مم",          project: "مجمع الخبر السكني",         value: "—",      date: "—",         status: "pending", wait: "~ساعة أخرى" },
  { id: "#BLD-2019", product: "مضخات مياه 2HP",        specs: "Grundfos",         project: "برج جدة – الدور 12",        value: "—",      date: "—",         status: "pending", wait: "~30 دقيقة" },
];

/* ─── NAV ─────────────────────────────────────────────────────── */
const PAGES = [
  { id: "home",      label: "الرئيسية",          Icon: LayoutDashboard },
  { id: "requests",  label: "طلباتي",            Icon: ClipboardList, pip: 2, pipC: "var(--red)", pipTxt: "#fff" },
  { id: "quotes",    label: "عروض الأسعار",      Icon: Package,       pip: 1, pipC: "#C5D92D",    pipTxt: "#1D3F1F" },
  { id: "shipments", label: "تتبع التوصيل",      Icon: Truck },
  { id: "projects",  label: "مشاريعي",           Icon: Building2 },
  { id: "finance",   label: "المالية والفواتير", Icon: BarChart3 },
  { id: "docs",      label: "المستندات",         Icon: FileText },
  { id: "settings",  label: "الإعدادات",         Icon: Settings },
];

/* ══════════════════════════════════════════════════════════════════
   PAGE: HOME
══════════════════════════════════════════════════════════════════ */
const HomePage = ({ onToast, onModal }) => (
  <div className="page-in">

    {/* ── Greeting banner ── */}
    <div style={{
      background: "linear-gradient(135deg, #1D3F1F 0%, #2A5C2D 100%)",
      borderRadius: 16, padding: "22px 26px", marginBottom: 20,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      boxShadow: "0 8px 28px rgba(29,63,31,.2)",
    }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>مرحباً، م. محمد 👋</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 5 }}>
          لديك <strong style={{ color: "#C5D92D" }}>عرض سعر</strong> ينتظر موافقتك و <strong style={{ color: "#C5D92D" }}>طلبان</strong> قيد التسعير
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn v="lime" onClick={() => onModal("newReq")}>
          <Plus size={13} /> طلب عرض سعر جديد
        </Btn>
        <Btn v="ghost" style={{ background: "rgba(255,255,255,.1)", color: "#fff", border: "1px solid rgba(255,255,255,.2)" }}
          onClick={() => onModal("boq")}>
          <Upload size={13} /> رفع BOQ
        </Btn>
      </div>
    </div>

    {/* ── Stats ── */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 13, marginBottom: 20 }}>
      <Stat icon={<ClipboardList size={17} />} label="إجمالي طلباتي"         value="12"   trend="+3 هذا الشهر" up="n"   color="#09B14B" delay={.04} />
      <Stat icon={<CheckCircle2  size={17} />} label="طلبات مكتملة"          value="8"    trend="↑ 25%"        up={true}  color="#09B14B" delay={.08} />
      <Stat icon={<Hourglass     size={17} />} label="قيد التسعير من بيلد"   value="2"    trend="انتظر العرض"  up="n"   color="#C5D92D" delay={.12} />
      <Stat icon={<DollarSign    size={17} />} label="إجمالي مشترياتي (ر.س)" value="284K" trend="↓ 12%"        up={false} color="#1D3F1F" delay={.16} />
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 324px", gap: 16 }}>
      {/* ── Left ── */}
      <div>
        {/* Waiting for price */}
        <div className="card" style={{ marginBottom: 16, borderColor: "rgba(197,217,45,.35)" }}>
          <div className="card-head" style={{ background: "linear-gradient(90deg,rgba(197,217,45,.1),transparent)" }}>
            <div>
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>⏳ جارٍ تسعير طلباتك</span>
                <span className="waiting-badge"><Timer size={11} /> بيلد يعمل</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>ستُبلَّغ فور وصول العرض — لا تحتاج لأي متابعة</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: "12px 16px" }}>
            {REQUESTS.filter(r => r.status === "pending").map((r, i) => (
              <div key={i} className="waiting-card">
                <div className="spinner" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--forest)" }}>{r.product}</div>
                  <div style={{ fontSize: 10.5, color: "var(--t3)", marginTop: 2 }}>{r.id} · {r.project}</div>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 11, color: "#5E6800", fontWeight: 700 }}>متوقع {r.wait}</div>
                  <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 2 }}>سيصلك إشعار</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Requests table */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">آخر طلباتي</div>
            <span style={{ fontSize: 11, color: "var(--green)", cursor: "pointer", fontWeight: 600 }}>عرض الكل ←</span>
          </div>
          <table className="tbl">
            <thead>
              <tr><th>الطلب</th><th>المنتج</th><th>المشروع</th><th>القيمة</th><th>الحالة</th></tr>
            </thead>
            <tbody>
              {REQUESTS.slice(0, 5).map((r, i) => (
                <tr key={i} onClick={() => r.status === "quoted" ? onModal("reviewQuote") : r.status === "done" ? onModal("orderDetail") : null}>
                  <td><span className="mono" style={{ fontSize: 10.5, color: "var(--t3)" }}>{r.id}</span></td>
                  <td>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--forest)" }}>{r.product}</div>
                    <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 1 }}>{r.specs}</div>
                  </td>
                  <td style={{ color: "var(--t2)", fontSize: 12 }}>{r.project}</td>
                  <td>
                    {r.value !== "—"
                      ? <><span className="mono" style={{ fontWeight: 700 }}>{r.value}</span> <span style={{ fontSize: 10, color: "var(--t3)" }}>ر.س</span></>
                      : <span style={{ color: "var(--t3)" }}>—</span>}
                  </td>
                  <td><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Right ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Quote arrived */}
        <div className="card" style={{ border: "1.5px solid rgba(9,177,75,.4)", overflow: "visible" }}>
          <div style={{
            background: "linear-gradient(135deg,#1D3F1F,#2A5C2D)",
            padding: "13px 16px", borderRadius: "12px 12px 0 0",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#C5D92D" }}>🎉 وصلك عرض سعر!</div>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.6)", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={11} /> 18 ساعة
            </span>
          </div>
          <div style={{ padding: 14 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--forest)" }}>أنابيب PPR كلاس C</div>
              <div style={{ fontSize: 10.5, color: "var(--t3)", marginTop: 2 }}>#BLD-2022 · Wavin · 200 متر · برج جدة</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <span className="mono" style={{ fontSize: 24, fontWeight: 700, color: "#09B14B" }}>31,750</span>
                <span style={{ fontSize: 11, color: "var(--t3)", marginRight: 4 }}>ر.س</span>
              </div>
              <span style={{ fontSize: 10.5, color: "var(--t2)" }}>شامل التوصيل</span>
            </div>
            <div style={{
              background: "var(--green-dim)", borderRadius: 8, padding: "8px 12px",
              marginBottom: 12, fontSize: 11, color: "#07823A", fontWeight: 500
            }}>
              ✅ سعر نهائي شامل — لا رسوم إضافية
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              <Btn onClick={() => onModal("reviewQuote")} style={{ flex: 1, justifyContent: "center" }}>
                <Eye size={13} /> مراجعة وقبول
              </Btn>
              <Btn v="ghost" sm>رفض</Btn>
            </div>
          </div>
        </div>

        {/* Activity */}
        <div className="card">
          <div className="card-head"><div className="card-title">آخر النشاطات</div></div>
          <div style={{ padding: "10px 16px" }}>
            {[
              { dot: "#09B14B", text: <>شحنة <b style={{ color: "var(--forest)" }}>الدهانات #BLD-2023</b> تصلك غداً</>,       time: "منذ ساعتين" },
              { dot: "#C5D92D", text: <>وصلك عرض سعر <b style={{ color: "var(--forest)" }}>أنابيب PPR</b> — راجعه الآن</>,  time: "منذ 3 ساعات" },
              { dot: "#A0B020", text: <>جارٍ تسعير <b style={{ color: "var(--forest)" }}>كابلات NYY</b> من قِبل بيلد</>,     time: "أمس 10:30 ص" },
              { dot: "var(--t3)", text: <>اكتمل طلب <b style={{ color: "var(--forest)" }}>الحديد #BLD-2024</b></>,           time: "أمس 8:00 ص" },
            ].map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 11 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 3 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: a.dot, flexShrink: 0 }} />
                  {i < 3 && <div style={{ width: 1, flex: 1, minHeight: 18, background: "var(--bdr)", margin: "3px 0" }} />}
                </div>
                <div style={{ paddingBottom: 14 }}>
                  <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.6 }}>{a.text}</div>
                  <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project progress */}
        <div className="card">
          <div className="card-head"><div className="card-title">تقدم التوريد</div></div>
          <div className="card-body">
            <PRow label="فيلا الرياض"  pct={72} color="#09B14B" />
            <PRow label="مجمع الخبر"   pct={45} color="#C5D92D" />
            <PRow label="برج جدة"      pct={18} color="#1D3F1F" />
          </div>
        </div>
      </div>
    </div>

    {/* Spending Chart */}
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-head">
        <div className="card-title">إنفاقي الشهري (ر.س)</div>
        <Btn v="ghost" sm><Download size={12} /> تصدير</Btn>
      </div>
      <div style={{ padding: "14px 18px 6px" }}><SpendChart /></div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   PAGE: REQUESTS
══════════════════════════════════════════════════════════════════ */
const RequestsPage = ({ onModal, onToast }) => {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const tabs = [
    { id: "all",      label: "الكل" },
    { id: "pending",  label: "بانتظار العرض" },
    { id: "quoted",   label: "عرض وصل ✦" },
    { id: "shipping", label: "في الطريق" },
    { id: "done",     label: "مكتمل" },
  ];
  const shown = REQUESTS.filter(r =>
    (filter === "all" || r.status === filter) &&
    (r.product.includes(q) || r.id.includes(q) || r.project.includes(q))
  );
  return (
    <div className="page-in">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} className={`chip${filter === t.id ? " on" : ""}`} onClick={() => setFilter(t.id)}>{t.label}</button>
        ))}
        <div style={{ marginRight: "auto", display: "flex", alignItems: "center", gap: 7, background: "var(--bg2)", border: "1.5px solid var(--bdr2)", borderRadius: 8, padding: "6px 11px" }}>
          <Search size={12} color="var(--t3)" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث..." style={{ background: "none", border: "none", outline: "none", color: "var(--t1)", fontFamily: "'IBM Plex Sans Arabic',sans-serif", fontSize: 12, width: 160 }} />
        </div>
        <Btn sm onClick={() => onModal("newReq")}><Plus size={12} /> طلب جديد</Btn>
      </div>

      {/* Pending waiting */}
      {(filter === "all" || filter === "pending") && (
        <div className="card" style={{ marginBottom: 14, borderColor: "rgba(197,217,45,.3)" }}>
          <div className="card-head">
            <div className="card-title">⏳ بيلد يسعّر طلباتك الآن</div>
            <span style={{ fontSize: 11, color: "var(--t3)" }}>ستُبلَّغ فور الانتهاء</span>
          </div>
          <div style={{ padding: "10px 16px 14px" }}>
            {REQUESTS.filter(r => r.status === "pending").map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "11px 14px", background: "var(--bg2)", borderRadius: 11, border: "1px solid var(--bdr)", marginBottom: 7 }}>
                <div className="spinner" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--forest)" }}>{r.product}</div>
                  <div style={{ fontSize: 10.5, color: "var(--t3)", marginTop: 1 }}>{r.id} · {r.project}</div>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 11, color: "#5E6800", fontWeight: 700 }}>متوقع {r.wait}</div>
                  <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 1 }}>إشعار تلقائي</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <table className="tbl">
          <thead>
            <tr><th>رقم الطلب</th><th>المنتج</th><th>المشروع</th><th>القيمة</th><th>التاريخ</th><th>الحالة</th><th></th></tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i} onClick={() => r.status === "quoted" ? onModal("reviewQuote") : r.status === "done" ? onModal("orderDetail") : null}>
                <td><span className="mono" style={{ fontSize: 10.5, color: "var(--t3)" }}>{r.id}</span></td>
                <td>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--forest)" }}>{r.product}</div>
                  <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 1 }}>{r.specs}</div>
                </td>
                <td style={{ color: "var(--t2)" }}>{r.project}</td>
                <td>{r.value !== "—" ? <><span className="mono" style={{ fontWeight: 700 }}>{r.value}</span> <span style={{ fontSize: 10, color: "var(--t3)" }}>ر.س</span></> : <span style={{ color: "var(--t3)" }}>—</span>}</td>
                <td><span className="mono" style={{ fontSize: 10.5, color: "var(--t3)" }}>{r.date}</span></td>
                <td><Badge status={r.status} /></td>
                <td onClick={e => e.stopPropagation()}>
                  {r.status === "quoted" && <Btn sm onClick={() => onModal("reviewQuote")}><Eye size={11} /> راجع</Btn>}
                  {r.status === "done"   && <Btn v="ghost" sm onClick={() => onModal("orderDetail")}><Eye size={11} /></Btn>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <div className="empty"><div style={{ fontSize: 36, marginBottom: 12, opacity: .3 }}>📋</div><div style={{ fontSize: 13 }}>لا يوجد</div></div>}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   PAGE: QUOTES
══════════════════════════════════════════════════════════════════ */
const QuotesPage = ({ onModal, onToast }) => (
  <div className="page-in">
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
      {[
        { n: "1", l: "عرض وصلك — راجعه الآن", c: "#09B14B", bg: "var(--green-dim)" },
        { n: "2", l: "قيد التسعير من بيلد",    c: "#5E6800", bg: "var(--lime-dim)" },
        { n: "8", l: "عروض مكتملة ومقبولة",   c: "var(--t2)", bg: "var(--forest-dim)" },
      ].map((k, i) => (
        <div key={i} style={{ background: k.bg, border: "1px solid var(--bdr)", borderRadius: 12, padding: 18, textAlign: "center" }}>
          <div className="mono" style={{ fontSize: 30, fontWeight: 700, color: k.c }}>{k.n}</div>
          <div style={{ fontSize: 11, color: "var(--t2)", marginTop: 5 }}>{k.l}</div>
        </div>
      ))}
    </div>

    {/* Arrived quote */}
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "var(--forest)", display: "flex", alignItems: "center", gap: 8 }}>
        🎉 عرض وصلك
        <span style={{ fontSize: 10, background: "var(--red-dim)", color: "var(--red)", padding: "2px 9px", borderRadius: 20, fontWeight: 600 }}>ينتهي خلال 18 ساعة</span>
      </div>
      <div className="quote-card" onClick={() => onModal("reviewQuote")}
        style={{ background: "#fff", border: "1.5px solid rgba(9,177,75,.35)", boxShadow: "0 4px 20px rgba(9,177,75,.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--forest)" }}>أنابيب PPR كلاس C</div>
            <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 3 }}>#BLD-2022 · 200 متر · برج جدة – الدور 12</div>
          </div>
          <span style={{ fontSize: 11, color: "var(--t3)", display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={11} /> 18 ساعة
          </span>
        </div>
        <div style={{ background: "var(--bg0)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 10.5, color: "var(--t3)", marginBottom: 10, fontWeight: 600, letterSpacing: .5 }}>تفاصيل العرض النهائي من بيلد</div>
          {[
            { k: "المنتج والتوريد",          v: "28,200 ر.س" },
            { k: "التوصيل لموقع مشروعك",     v: "1,850 ر.س" },
            { k: "خدمة بيلد",                v: "1,700 ر.س" },
          ].map((row, i) => (
            <div className="sum-row" key={i}>
              <span style={{ color: "var(--t2)" }}>{row.k}</span>
              <span className="mono" style={{ color: "var(--forest)" }}>{row.v}</span>
            </div>
          ))}
          <div className="sum-row">
            <span style={{ fontWeight: 700, color: "var(--forest)" }}>إجمالي ما ستدفعه</span>
            <span className="mono" style={{ color: "#09B14B", fontSize: 22 }}>31,750 ر.س</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={e => { e.stopPropagation(); onModal("reviewQuote"); }} style={{ flex: 1, justifyContent: "center" }}>
            <Check size={13} /> قبول العرض والمضي في التوريد
          </Btn>
          <Btn v="ghost" onClick={e => e.stopPropagation()}>طلب تعديل</Btn>
          <Btn v="danger" onClick={e => e.stopPropagation()}>رفض</Btn>
        </div>
      </div>
    </div>

    {/* Pending */}
    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "var(--forest)" }}>⏳ طلبات قيد التسعير</div>
    <div className="card">
      <div className="card-body">
        {REQUESTS.filter(r => r.status === "pending").map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: 13, background: "var(--bg2)", borderRadius: 11, border: "1px solid var(--bdr)", marginBottom: 8 }}>
            <div className="spinner" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--forest)" }}>{r.product}</div>
              <div style={{ fontSize: 10.5, color: "var(--t3)", marginTop: 1 }}>{r.id} · {r.project}</div>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, color: "#5E6800", fontWeight: 700 }}>متوقع {r.wait}</div>
              <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 2 }}>ستُبلَّغ فور الانتهاء</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   PAGE: SHIPMENTS
══════════════════════════════════════════════════════════════════ */
const ShipmentsPage = () => {
  const [sel, setSel] = useState(0);
  const ships = [
    { id: "#SHP-441", product: "دهانات خارجية 500ل", project: "مجمع الخبر السكني", eta: "24 فبراير", status: "shipping" },
    { id: "#SHP-440", product: "أنابيب PPR 200م",    project: "برج جدة – الدور 12", eta: "27 فبراير", status: "quoted" },
  ];
  const steps = [
    { label: "تم تأكيد طلبك",             sub: "18 فبراير 9:00 ص",         done: true },
    { label: "جارٍ تجهيز الشحنة",          sub: "20 فبراير 2:00 م",         done: true },
    { label: "الشحنة في الطريق إليك",      sub: "متوقع الوصول: 24 فبراير",  done: false, active: true },
    { label: "وصلت لمنطقتك",               sub: "مجمع الخبر السكني",        done: false },
    { label: "تم التسليم وتأكيد الاستلام", sub: "—",                         done: false },
  ];
  return (
    <div className="page-in" style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: 16 }}>
      <div className="card">
        <div className="card-head"><div className="card-title">شحناتي النشطة</div></div>
        <table className="tbl">
          <thead><tr><th>رقم الشحنة</th><th>المنتج</th><th>المشروع</th><th>التسليم المتوقع</th><th>الحالة</th></tr></thead>
          <tbody>
            {ships.map((s, i) => (
              <tr key={i} onClick={() => setSel(i)}
                style={{ background: sel === i ? "var(--green-dim)" : "" }}>
                <td><span className="mono" style={{ fontSize: 10.5, color: "var(--t3)" }}>{s.id}</span></td>
                <td style={{ fontWeight: 600, color: "var(--forest)" }}>{s.product}</td>
                <td style={{ color: "var(--t2)" }}>{s.project}</td>
                <td><span className="mono" style={{ fontSize: 11, color: "#09B14B", fontWeight: 700 }}>{s.eta}</span></td>
                <td><Badge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ height: "fit-content" }}>
        <div className="card-head">
          <div>
            <div className="card-title">تتبع {ships[sel].id}</div>
            <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 2 }}>{ships[sel].product}</div>
          </div>
          <Badge status="shipping" />
        </div>
        <div style={{ padding: 16 }}>
          <Timeline steps={steps} />
          <div style={{ marginTop: 14, padding: "11px 13px", background: "var(--green-dim)", borderRadius: 9, fontSize: 11.5, color: "#07823A", textAlign: "center", fontWeight: 500 }}>
            📍 في الطريق — يصلك <strong>{ships[sel].eta}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   PAGE: PROJECTS
══════════════════════════════════════════════════════════════════ */
const ProjectsPage = () => (
  <div className="page-in">
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
      {[
        { name: "فيلا الرياض",      loc: "حي النخيل، الرياض",        pct: 72, orders: 6, spend: "146K", color: "#09B14B", status: "shipping" },
        { name: "مجمع الخبر السكني", loc: "الخبر، المنطقة الشرقية",  pct: 45, orders: 4, spend: "89K",  color: "#C5D92D", status: "shipping" },
        { name: "برج جدة التجاري",  loc: "حي الشرفية، جدة",          pct: 18, orders: 2, spend: "49K",  color: "#1D3F1F", status: "early" },
      ].map((p, i) => (
        <div key={i} className="card" style={{ padding: 18, cursor: "pointer", transition: "transform .2s, box-shadow .2s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(29,63,31,.1)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
          <div style={{ height: 4, background: p.color, borderRadius: 4, margin: "-18px -18px 18px", opacity: .9 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--forest)" }}>{p.name}</div>
              <div style={{ fontSize: 10.5, color: "var(--t3)", marginTop: 3 }}>{p.loc}</div>
            </div>
            <Badge status={p.status} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "var(--t2)" }}>نسبة التوريد المكتمل</span>
              <span className="mono" style={{ fontSize: 11, color: p.color, fontWeight: 700 }}>{p.pct}%</span>
            </div>
            <PRow label="" pct={p.pct} color={p.color} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
            {[{ l: "الطلبات", v: String(p.orders) }, { l: "الإنفاق", v: p.spend + " ر.س" }].map((s, j) => (
              <div key={j} style={{ background: "var(--bg2)", borderRadius: 8, padding: 10, textAlign: "center", border: "1px solid var(--bdr)" }}>
                <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--forest)" }}>{s.v}</div>
                <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 3 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   PAGE: FINANCE
══════════════════════════════════════════════════════════════════ */
const FinancePage = ({ onToast }) => (
  <div className="page-in">
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 13, marginBottom: 20 }}>
      <Stat icon={<DollarSign   size={17} />} label="إجمالي إنفاقي (ر.س)"  value="284K" trend="↑ 8%"       up={true}  color="#09B14B" delay={.04} />
      <Stat icon={<CheckCircle2 size={17} />} label="مبالغ مسددة (ر.س)"    value="231K" trend="مدفوع"       up="n"   color="#09B14B" delay={.08} />
      <Stat icon={<Clock        size={17} />} label="مبالغ مستحقة (ر.س)"   value="53K"  trend="قريباً"       up={false} color="#1D3F1F" delay={.12} />
      <Stat icon={<Zap          size={17} />} label="طلبات هذا الشهر"       value="3"    trend="نشط"          up="n"   color="#C5D92D" delay={.16} />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-head">
            <div className="card-title">الإنفاق الشهري</div>
            <Btn v="ghost" sm onClick={() => onToast({ icon: "📄", msg: "جارٍ التصدير", sub: "سيُرسل PDF لبريدك" })}>
              <Download size={12} /> تصدير
            </Btn>
          </div>
          <div style={{ padding: "14px 18px 6px" }}><SpendChart /></div>
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">توزيع الإنفاق حسب المشروع</div></div>
          <div className="card-body">
            <PRow label="فيلا الرياض"  pct={52} color="#09B14B" />
            <PRow label="مجمع الخبر"   pct={31} color="#C5D92D" />
            <PRow label="برج جدة"      pct={17} color="#1D3F1F" />
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><div className="card-title">سجل الفواتير</div></div>
        <table className="tbl">
          <thead><tr><th>رقم الفاتورة</th><th>المنتج</th><th>التاريخ</th><th>المبلغ</th><th>الحالة</th></tr></thead>
          <tbody>
            {[
              { id: "#INV-088", product: "حديد تسليح T16",  date: "15 فبراير", amount: "48,500", status: "done" },
              { id: "#INV-087", product: "بلاط بورسلان",    date: "10 فبراير", amount: "22,000", status: "done" },
              { id: "#INV-086", product: "دهانات خارجية",   date: "24 فبراير", amount: "12,200", status: "pending" },
            ].map((inv, i) => (
              <tr key={i}>
                <td><span className="mono" style={{ fontSize: 10.5, color: "var(--t3)" }}>{inv.id}</span></td>
                <td style={{ fontWeight: 600, color: "var(--forest)" }}>{inv.product}</td>
                <td><span className="mono" style={{ fontSize: 10.5, color: "var(--t3)" }}>{inv.date}</span></td>
                <td><span className="mono" style={{ fontWeight: 700 }}>{inv.amount}</span> <span style={{ fontSize: 10, color: "var(--t3)" }}>ر.س</span></td>
                <td><Badge status={inv.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   MODALS
══════════════════════════════════════════════════════════════════ */
const NewRequestModal = ({ open, onClose, onSubmit }) => (
  <Modal open={open} onClose={onClose}
    title="طلب عرض سعر جديد"
    sub="أدخل التفاصيل وسيصلك عرض بيلد النهائي شامل التوصيل"
    footer={<><Btn onClick={onSubmit}><SendHorizonal size={13} /> إرسال الطلب لبيلد</Btn><Btn v="ghost" onClick={onClose}>إلغاء</Btn></>}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {[
        { label: "المنتج / المادة *",      type: "text",   placeholder: "مثال: حديد تسليح T16",   full: false },
        { label: "الكمية *",               type: "number", placeholder: "0",                        full: false },
        { label: "الوحدة",                 type: "sel",    opts: ["طن","متر طولي","متر مربع","لتر","وحدة"], full: false },
        { label: "المشروع *",              type: "sel",    opts: ["اختر المشروع","فيلا الرياض – قطعة 14","مجمع الخبر السكني","برج جدة التجاري"], full: false },
        { label: "عنوان موقع التوصيل",    type: "text",   placeholder: "الحي، الشارع، رقم القطعة", full: true },
        { label: "تاريخ التسليم المطلوب", type: "date",   placeholder: "",                         full: false },
        { label: "ملاحظات ومواصفات",      type: "area",   placeholder: "أي تفاصيل تساعد بيلد على إيجاد أفضل عرض...", full: true },
      ].map((f, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: f.full ? "1/-1" : "auto" }}>
          <label style={{ fontSize: 11, color: "var(--t2)", fontWeight: 500 }}>{f.label}</label>
          {f.type === "sel"  && <select className="inp">{f.opts.map(o => <option key={o}>{o}</option>)}</select>}
          {f.type === "area" && <textarea className="inp" rows={3} placeholder={f.placeholder} />}
          {f.type !== "sel" && f.type !== "area" && <input className="inp" type={f.type} placeholder={f.placeholder} />}
        </div>
      ))}
    </div>
    <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--lime-dim)", border: "1px solid rgba(197,217,45,.4)", borderRadius: 9, fontSize: 11.5, color: "#5E6800", display: "flex", alignItems: "center", gap: 8 }}>
      <Hourglass size={14} /> سيصلك عرض السعر النهائي من بيلد خلال <strong>ساعة إلى يوم عمل</strong> حسب المنتج والتوافر
    </div>
  </Modal>
);

const ReviewQuoteModal = ({ open, onClose, onAccept }) => (
  <Modal open={open} onClose={onClose}
    title="عرض السعر #BLD-2022"
    sub="أنابيب PPR كلاس C · Wavin · 200 متر · برج جدة – الدور 12"
    footer={<>
      <Btn onClick={onAccept}><Check size={13} /> قبول وتأكيد التوريد</Btn>
      <Btn v="ghost" onClick={onClose}>طلب تعديل</Btn>
      <Btn v="danger" onClick={onClose}>رفض</Btn>
    </>}>
    <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
      <Badge status="quoted" />
      <span style={{ fontSize: 11, color: "var(--red)", display: "flex", alignItems: "center", gap: 5 }}>
        <Clock size={11} /> ينتهي العرض خلال 18 ساعة
      </span>
    </div>
    <div style={{ background: "var(--bg2)", borderRadius: 11, padding: 16, marginBottom: 14, border: "1px solid var(--bdr)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { l: "المشروع",             v: "برج جدة – الدور 12" },
          { l: "الكمية المطلوبة",     v: "200 متر طولي" },
          { l: "موعد التسليم المتوقع",v: "27 فبراير 2026" },
          { l: "موقع التسليم",        v: "موقع مشروعك مباشرة" },
        ].map((d, i) => (
          <div key={i}>
            <div style={{ fontSize: 10, color: "var(--t3)" }}>{d.l}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--forest)", marginTop: 4 }}>{d.v}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{ background: "var(--bg2)", borderRadius: 11, padding: 16, border: "1px solid var(--bdr)" }}>
      <div style={{ fontSize: 11, color: "var(--t3)", marginBottom: 12, fontWeight: 600 }}>تفاصيل السعر — شامل ولا رسوم خفية</div>
      {[
        { k: "المنتج والتوريد",       v: "28,200 ر.س" },
        { k: "التوصيل لموقع مشروعك", v: "1,850 ر.س" },
        { k: "خدمة بيلد",             v: "1,700 ر.س" },
      ].map((r, i) => (
        <div className="sum-row" key={i}>
          <span style={{ color: "var(--t2)" }}>{r.k}</span>
          <span className="mono" style={{ color: "var(--forest)" }}>{r.v}</span>
        </div>
      ))}
      <div className="sum-row">
        <span style={{ color: "var(--forest)" }}>إجمالي ما ستدفعه</span>
        <span className="mono" style={{ color: "#09B14B", fontSize: 24 }}>31,750 ر.س</span>
      </div>
    </div>
  </Modal>
);

const OrderDetailModal = ({ open, onClose, onToast }) => (
  <Modal open={open} onClose={onClose}
    title="تفاصيل الطلب #BLD-2024"
    sub="حديد تسليح T16 · SABIC · 40 طن"
    footer={<>
      <Btn v="ghost" onClick={() => onToast({ icon: "📄", msg: "جارٍ إنشاء الفاتورة", sub: "PDF سيُحمَّل قريباً" })}>
        <Download size={13} /> تحميل الفاتورة
      </Btn>
      <Btn v="ghost" onClick={onClose}>إغلاق</Btn>
    </>}>
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      <Badge status="done" />
      <span style={{ fontSize: 11, color: "var(--t3)" }}>15 فبراير 2026</span>
    </div>
    <div style={{ background: "var(--bg2)", borderRadius: 11, padding: 16, marginBottom: 14, border: "1px solid var(--bdr)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { l: "المشروع",      v: "فيلا الرياض – قطعة 14" },
          { l: "الكمية",       v: "40 طن" },
          { l: "تاريخ التسليم",v: "15 فبراير 2026" },
          { l: "التسليم",      v: "✅ تم التسليم لموقعك" },
        ].map((d, i) => (
          <div key={i}>
            <div style={{ fontSize: 10, color: "var(--t3)" }}>{d.l}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--forest)", marginTop: 4 }}>{d.v}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{ background: "var(--bg2)", borderRadius: 11, padding: 16, border: "1px solid var(--bdr)" }}>
      {[
        { k: "المنتج والتوريد",       v: "44,000 ر.س" },
        { k: "التوصيل لموقع مشروعك", v: "2,500 ر.س" },
        { k: "خدمة بيلد",             v: "2,000 ر.س" },
      ].map((r, i) => (
        <div className="sum-row" key={i}>
          <span style={{ color: "var(--t2)" }}>{r.k}</span>
          <span className="mono" style={{ color: "var(--forest)" }}>{r.v}</span>
        </div>
      ))}
      <div className="sum-row">
        <span style={{ color: "var(--forest)" }}>إجمالي ما دفعته</span>
        <span className="mono" style={{ color: "#09B14B", fontSize: 24 }}>48,500 ر.س</span>
      </div>
    </div>
  </Modal>
);

const BOQModal = ({ open, onClose, onSubmit }) => (
  <Modal open={open} onClose={onClose}
    title="رفع جدول الكميات BOQ"
    sub="ارفع ملفك وستحصل على عروض أسعار لجميع البنود شاملة التوصيل"
    footer={<><Btn onClick={onSubmit}><SendHorizonal size={13} /> إرسال لبيلد</Btn><Btn v="ghost" onClick={onClose}>إلغاء</Btn></>}>
    <div className="drop-zone" onClick={onSubmit}>
      <div style={{ fontSize: 44, marginBottom: 14 }}>📊</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--forest)", marginBottom: 6 }}>اسحب ملف BOQ هنا</div>
      <div style={{ fontSize: 11.5, color: "var(--t3)", marginBottom: 18 }}>يدعم: Excel (.xlsx) · CSV · الحد الأقصى 50MB</div>
      <Btn v="outline"><Upload size={13} /> اختر الملف</Btn>
    </div>
    <div style={{ marginTop: 14, padding: "12px 14px", background: "var(--lime-dim)", border: "1px solid rgba(197,217,45,.4)", borderRadius: 9, fontSize: 11.5, color: "#5E6800", display: "flex", alignItems: "center", gap: 8 }}>
      <Zap size={14} /> بيلد سيُسعّر كل بند تلقائياً ويرسل لك العروض شاملة التوصيل
    </div>
  </Modal>
);

/* ══════════════════════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════════════════════ */
export default function BuildApp() {
  const [page,  setPage]  = useState("home");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const tRef = useRef(null);

  const showToast = t => {
    setToast(t);
    clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setToast(null), 3800);
  };

  const navTo = id => {
    if (id === "docs" || id === "settings") {
      showToast({ icon: "🔧", msg: "قريباً", sub: "هذا القسم قيد التطوير" });
      return;
    }
    setPage(id);
  };

  const renderPage = () => {
    const p = { onToast: showToast, onModal: setModal };
    switch (page) {
      case "home":      return <HomePage      {...p} />;
      case "requests":  return <RequestsPage  {...p} />;
      case "quotes":    return <QuotesPage    {...p} />;
      case "shipments": return <ShipmentsPage />;
      case "projects":  return <ProjectsPage />;
      case "finance":   return <FinancePage   {...p} />;
      default:          return <HomePage      {...p} />;
    }
  };

  const pageTitles = {
    home: "الرئيسية", requests: "طلباتي", quotes: "عروض الأسعار",
    shipments: "تتبع التوصيل", projects: "مشاريعي", finance: "المالية والفواتير",
  };

  return (
    <>
      <FontStyle />

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <div className="logo-mark">BUILD</div>
          <div className="logo-sub">منصة مشترياتك الإنشائية</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
          {[
            { sec: "الرئيسية", ids: ["home", "requests", "quotes"] },
            { sec: "المشاريع", ids: ["projects", "shipments"] },
            { sec: "المالية",  ids: ["finance", "docs", "settings"] },
          ].map(g => (
            <div key={g.sec}>
              <div className="nav-section-label">{g.sec}</div>
              {g.ids.map(id => {
                const n = PAGES.find(x => x.id === id);
                const on = page === id;
                return (
                  <div key={id} className={`nav-link${on ? " on" : ""}`} onClick={() => navTo(id)}>
                    <n.Icon size={15} style={{ flexShrink: 0, opacity: .85 }} />
                    <span className="nav-lbl">{n.label}</span>
                    {n.pip && (
                      <span className="nav-pip" style={{
                        background: on ? "transparent" : n.pipC,
                        color: on ? "#C5D92D" : n.pipTxt,
                        border: on ? "1px solid #C5D92D" : "none",
                      }}>{n.pip}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: "10px 10px 14px", borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <div className="user-card">
            <div style={{
              width: 34, height: 34, flexShrink: 0, borderRadius: 9,
              background: "linear-gradient(135deg,#C5D92D,#A0B020)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, color: "#1D3F1F", fontSize: 13,
              boxShadow: "0 2px 10px rgba(197,217,45,.4)",
            }}>م</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>م. محمد السعيد</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 1 }}>مقاول · الرياض</div>
            </div>
            <MoreHorizontal size={14} color="rgba(255,255,255,.3)" />
          </div>

          {/* Lang / Help */}
          <div style={{ display: "flex", gap: 6, padding: "4px 4px 0" }}>
            {[{ Icon: Globe, label: "EN" }, { Icon: HelpCircle, label: "مساعدة" }].map((b, i) => (
              <div key={i} onClick={() => showToast({ icon: "🌐", msg: b.label === "EN" ? "Switch to English" : "مركز المساعدة", sub: "قريباً" })}
                style={{
                  flex: 1, height: 30, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 5, cursor: "pointer", fontSize: 10, color: "rgba(255,255,255,.4)", transition: "all .14s"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)"; e.currentTarget.style.color = "rgba(255,255,255,.8)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.color = "rgba(255,255,255,.4)"; }}>
                <b.Icon size={11} /> {b.label}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── TOPBAR ── */}
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--forest)" }}>{pageTitles[page] || "الرئيسية"}</div>
          <div style={{ fontSize: 10.5, color: "var(--t3)", marginTop: 1 }}>الأحد، 22 فبراير 2026</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="icon-btn" onClick={() => showToast({ icon: "🔔", msg: "إشعارات جديدة", sub: "عرض سعر جاهز للمراجعة" })} style={{ position: "relative" }}>
            <Bell size={14} />
            <div className="n-dot" />
          </div>
          <div className="icon-btn"><Search size={14} /></div>
          <Btn v="ghost" sm onClick={() => setModal("boq")}><Upload size={12} /> رفع BOQ</Btn>
          <Btn sm onClick={() => setModal("newReq")}><Plus size={12} /> طلب عرض سعر</Btn>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <main style={{ marginRight: "var(--sidebar)", padding: "72px 24px 40px", minWidth: 0 }}>
        {renderPage()}
      </main>

      {/* ── MODALS ── */}
      <NewRequestModal open={modal === "newReq"} onClose={() => setModal(null)}
        onSubmit={() => { setModal(null); showToast({ icon: "📨", msg: "تم إرسال طلبك لبيلد", sub: "ستُبلَّغ بإشعار فور وصول عرض السعر" }); }} />
      <ReviewQuoteModal open={modal === "reviewQuote"} onClose={() => setModal(null)}
        onAccept={() => { setModal(null); showToast({ icon: "🎉", msg: "تم قبول العرض!", sub: "سيبدأ التوريد والشحن خلال 24 ساعة" }); }} />
      <OrderDetailModal open={modal === "orderDetail"} onClose={() => setModal(null)} onToast={showToast} />
      <BOQModal open={modal === "boq"} onClose={() => setModal(null)}
        onSubmit={() => { setModal(null); showToast({ icon: "📊", msg: "تم رفع جدول الكميات", sub: "بيلد يعمل على تسعير جميع البنود" }); }} />

      {/* ── TOAST ── */}
      {toast && <Toast t={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}
