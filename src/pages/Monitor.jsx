import { useEffect, useRef, useState, useCallback } from "react";
import api from "../services/api";
import { getSocket } from "../socket";
import "../index.css";

const HIGHLIGHT_DURATION = 5000; // ms
const MAX_ITEMS = 10;

function formatTime(ts) {
  if (!ts) return "--:--";
  const d = new Date(ts);
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// Normaliza location que pode ser string ou objeto {code, name}
function resolveLocation(location) {
  if (!location) return "—";
  if (typeof location === "string") return location;
  return location.code
    ? `${location.code}${location.name ? ` · ${location.name}` : ""}`
    : location.name || "—";
}

// Normaliza user que pode ser string ou objeto {name}
function resolveUser(user) {
  if (!user) return "—";
  if (typeof user === "string") return user;
  return user.name || user.username || "—";
}

// Normaliza timestamp (pode vir como timestamp ou createdAt)
function resolveTimestamp(item) {
  return item.timestamp || item.createdAt || null;
}

// ── Som curto gerado programaticamente ──────────────
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    /* ignore */
  }
}

// ── Clock ────────────────────────────────────────────
function Clock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="monitor-clock">
      {time.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </span>
  );
}

// ── Hero card (última retirada) ───────────────────────
function Hero({ item, highlight }) {
  if (!item) {
    return (
      <div className="monitor-hero">
        <span className="hero-empty">Aguardando retiradas...</span>
      </div>
    );
  }
  return (
    <div className="monitor-hero">
      <span className="hero-label">Última retirada</span>
      <div className={`hero-product${highlight ? " highlight" : ""}`}>
        {item.productCode}
      </div>
      <div className="hero-location">📍 {resolveLocation(item.location)}</div>
      <div className="hero-meta">
        <span className="hero-user">👤 {resolveUser(item.user)}</span>
        <span className="hero-time">
          {formatDate(resolveTimestamp(item))} ·{" "}
          {formatTime(resolveTimestamp(item))}
        </span>
      </div>
    </div>
  );
}

// ── Item da lista lateral ────────────────────────────
function WithdrawalItem({ item }) {
  const [isNew, setIsNew] = useState(item._isNew || false);

  useEffect(() => {
    if (!item._isNew) return;
    const id = setTimeout(() => setIsNew(false), HIGHLIGHT_DURATION);
    return () => clearTimeout(id);
  }, [item._isNew]);

  return (
    <div className={`withdrawal-item${isNew ? " new" : ""}`}>
      <div>
        <div className="item-product">{item.productCode}</div>
        <div className="item-location">{resolveLocation(item.location)}</div>
        <div className="item-user">{resolveUser(item.user)}</div>
      </div>
      <div className="item-time">
        {formatDate(resolveTimestamp(item))}
        <br />
        {formatTime(resolveTimestamp(item))}
      </div>
    </div>
  );
}

// ── Monitor principal ─────────────────────────────────
export default function Monitor() {
  const [items, setItems] = useState([]);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [heroHighlight, setHeroHighlight] = useState(false);
  const highlightTimerRef = useRef(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // ── 1. Histórico inicial ──────────────────────────
  useEffect(() => {
    api
      .get("/api/monitor/recent-withdrawals?limit=10")
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.withdrawals || [];
        setItems(list.slice(0, MAX_ITEMS));
      })
      .catch((err) => console.error("Erro ao carregar histórico:", err));
  }, []);

  // ── 2. WebSocket ──────────────────────────────────
  const handleWithdraw = useCallback(
    (event) => {
      if (pausedRef.current) return;
      if (!muted) playBeep();

      setItems((prev) => {
        const newItem = { ...event, _isNew: true };
        return [newItem, ...prev].slice(0, MAX_ITEMS);
      });

      // Highlight hero por HIGHLIGHT_DURATION ms
      setHeroHighlight(true);
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(
        () => setHeroHighlight(false),
        HIGHLIGHT_DURATION,
      );
    },
    [muted],
  );

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("product:withdraw", handleWithdraw);

    // Sincronizar estado inicial sem chamar setState diretamente no body do effect
    const initialConnected = socket.connected;
    Promise.resolve().then(() => setConnected(initialConnected));

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("product:withdraw", handleWithdraw);
    };
  }, [handleWithdraw]);

  // ── Fullscreen ────────────────────────────────────
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const topItem = items[0] || null;

  return (
    <div className="monitor-root">
      {/* Header */}
      <header className="monitor-header">
        <div className="monitor-header-title">
          <span>📦</span>
          <span>Monitor de Retiradas</span>
          <span className={connected ? "badge-online" : "badge-offline"}>
            {connected ? "online" : "offline"}
          </span>
        </div>

        <div className="monitor-header-controls">
          <Clock />

          <button
            className={`ctrl-btn${paused ? " active" : ""}`}
            onClick={() => setPaused((p) => !p)}
            title="Pausar / retomar atualizações"
          >
            {paused ? "▶ Retomar" : "⏸ Pausar"}
          </button>

          <button
            className={`ctrl-btn${muted ? " active" : ""}`}
            onClick={() => setMuted((m) => !m)}
            title="Mudo / com som"
          >
            {muted ? "🔇 Mudo" : "🔊 Som"}
          </button>

          <button
            className="ctrl-btn"
            onClick={toggleFullscreen}
            title="Tela cheia (F11)"
          >
            ⛶ Tela cheia
          </button>
        </div>
      </header>

      {paused && <div className="paused-banner">⏸ Atualizações pausadas</div>}

      {/* Body */}
      <div className="monitor-body">
        {/* Hero */}
        <Hero item={topItem} highlight={heroHighlight} />

        {/* Sidebar list */}
        <aside className="monitor-sidebar">
          <div className="sidebar-header">Histórico — últimas {MAX_ITEMS}</div>
          <div className="sidebar-list">
            {items.length === 0 ? (
              <div
                style={{
                  padding: "24px 20px",
                  color: "rgba(255,255,255,0.25)",
                  fontSize: "0.85rem",
                }}
              >
                Nenhuma retirada registrada.
              </div>
            ) : (
              items.map((item, idx) => (
                <WithdrawalItem
                  key={`${item.productCode}-${item.timestamp}-${idx}`}
                  item={item}
                />
              ))
            )}
          </div>
        </aside>
      </div>

      <span className="fullscreen-hint">F11 para tela cheia</span>
    </div>
  );
}
