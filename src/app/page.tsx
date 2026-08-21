"use client";

import { useEffect, useState, type ReactNode } from "react";

import { FixturesPanel } from "@/components/fixtures-panel";

type IconName =
  | "research"
  | "fixtures"
  | "ticket"
  | "history"
  | "settings"
  | "calendar"
  | "arrow"
  | "spark"
  | "shield"
  | "chart";

const navItems: { label: string; icon: IconName; badge?: string }[] = [
  { label: "Research", icon: "research" },
  { label: "Fixtures", icon: "fixtures", badge: "18" },
  { label: "Tickets", icon: "ticket", badge: "3" },
  { label: "History", icon: "history" },
  { label: "Settings", icon: "settings" },
];

const quickPrompts = [
  "Low-risk home picks",
  "Over 1.5 goals",
  "Avoid weak away form",
];

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    research: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.2 4.2" />
        <path d="M8.5 11h5M11 8.5v5" />
      </>
    ),
    fixtures: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M7 3v4M17 3v4M3 10h18" />
        <path d="m8 15 2 2 5-5" />
      </>
    ),
    ticket: (
      <>
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v3a3 3 0 0 0 0 6v3a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-3a3 3 0 0 0 0-6Z" />
        <path d="M12 7v10" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
    arrow: <path d="m9 18 6-6-6-6" />,
    spark: (
      <>
        <path d="m12 3 1.4 4.2L18 9l-4.6 1.8L12 15l-1.4-4.2L6 9l4.6-1.8Z" />
        <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7Z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.7 2.8 8 7 10 4.2-2 7-5.3 7-10V6Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {paths[name]}
    </svg>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">S</span>
        <span className="brand-copy">
          <strong>Suode</strong>
          <small>LOCAL RESEARCH LAB</small>
        </span>
      </div>

      <nav className="desktop-nav" aria-label="Primary navigation">
        <p className="nav-label">Workspace</p>
        {navItems.map((item, index) => (
          <button className={`nav-item ${index === 0 ? "active" : ""}`} key={item.label}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
          </button>
        ))}
      </nav>

      <div className="local-card">
        <span className="local-icon"><Icon name="shield" size={18} /></span>
        <div>
          <strong>Private by default</strong>
          <p>Your research stays on this computer.</p>
        </div>
      </div>
    </aside>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/config/status", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to read local configuration");
        return response.json() as Promise<{ apiFootball: { configured: boolean } }>;
      })
      .then((data) => setApiConfigured(data.apiFootball.configured))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") {
          setApiConfigured(false);
        }
      });

    return () => controller.abort();
  }, []);

  function runResearch() {
    setNotice(
      query.trim()
        ? "The research engine will be connected in Phase 2. Your workspace shell is ready."
        : "Describe the matches or strategy you want to research first.",
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="date-line">Thursday, 20 August</p>
            <h1>Good afternoon.</h1>
          </div>
          <div className="topbar-actions">
            <span className="status-pill"><i /> Local mode</span>
            <button className="date-button">
              <Icon name="calendar" size={18} />
              Today
            </button>
            <button className="avatar" aria-label="Open local profile">VL</button>
          </div>
        </header>

        <section className="stats-grid" aria-label="Workspace overview">
          <article className="stat-card hero-stat">
            <div className="stat-icon"><Icon name="fixtures" /></div>
            <div><span>Today&apos;s slate</span><strong>18</strong></div>
            <small>Across 5 followed leagues</small>
          </article>
          <article className="stat-card">
            <div className="stat-icon green"><Icon name="spark" /></div>
            <div><span>Strong signals</span><strong>6</strong></div>
            <small>Confidence above 65%</small>
          </article>
          <article className="stat-card">
            <div className="stat-icon amber"><Icon name="ticket" /></div>
            <div><span>Saved tickets</span><strong>3</strong></div>
            <small>Stored on this device</small>
          </article>
          <article className="stat-card">
            <div className="stat-icon blue"><Icon name="chart" /></div>
            <div>
              <span>Data status</span>
              <strong className={apiConfigured ? "ready-text" : "setup-text"}>
                {apiConfigured === null ? "Checking" : apiConfigured ? "Configured" : "Setup needed"}
              </strong>
            </div>
            <small>{apiConfigured ? "API key is stored server-side" : "Add API_FOOTBALL_KEY locally"}</small>
          </article>
        </section>

        <section className="research-panel">
          <div className="research-copy">
            <span className="section-kicker"><Icon name="spark" size={17} /> Research workspace</span>
            <h2>What do you want to find?</h2>
            <p>Describe a strategy in plain language. Suode will turn it into transparent filters and explain every signal.</p>
          </div>
          <div className="prompt-box">
            <textarea
              aria-label="Research request"
              onChange={(event) => { setQuery(event.target.value); setNotice(""); }}
              placeholder="e.g. Find low-risk home picks from today’s top leagues and avoid teams with weak recent form…"
              rows={3}
              value={query}
            />
            <div className="prompt-footer">
              <span><kbd>⌘</kbd><kbd>↵</kbd> to run</span>
              <button onClick={runResearch}><Icon name="research" size={18} /> Run research</button>
            </div>
          </div>
          <div className="quick-row">
            <span>Try:</span>
            {quickPrompts.map((prompt) => (
              <button key={prompt} onClick={() => { setQuery(prompt); setNotice(""); }}>{prompt}</button>
            ))}
          </div>
          {notice ? <p className="notice" role="status">{notice}</p> : null}
        </section>

        <FixturesPanel />
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 4).map((item, index) => (
          <button className={index === 0 ? "active" : ""} key={item.label}>
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
