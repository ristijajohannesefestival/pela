import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const BASE = "https://<REF>.supabase.co/functions/v1/make-server-d5eddf57";

// lihtne lokaal-ID (külastaja sessioon)
function getSessionId() {
  const k = "pela_session_id";
  let v = localStorage.getItem(k);
  if (!v) {
    v = Math.random().toString(36).slice(2);
    localStorage.setItem(k, v);
  }
  return v;
}

type Result = { id: string; spotifyId: string; uri: string; title: string; artist: string; albumArt?: string };
type QueueItem = Result & { hype?: number; addedAt?: number; };

export default function AudiencePage() {
  const { venueId = "demo-venue" } = useParams();
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Result[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const sessionId = useMemo(getSessionId, []);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/search-spotify?q=${encodeURIComponent(q)}`);
      const j = await r.json();
      setRes(j.results ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function addSong(s: Result) {
    const r = await fetch(`${BASE}/add-song`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venueId, sessionId,
        song: {
          title: s.title, artist: s.artist, albumArt: s.albumArt,
          uri: s.uri, spotifyId: s.spotifyId
        }
      }),
    });
    const j = await r.json();
    if (!r.ok) return alert(j.error ?? "Failed to add");
    alert("Added!");
    loadQueue();
  }

  async function vote(id: string) {
    const r = await fetch(`${BASE}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueId, songId: id, sessionId }),
    });
    const j = await r.json();
    if (!r.ok) return alert(j.error ?? "Failed to vote");
    loadQueue();
  }

  async function loadQueue() {
    const r = await fetch(`${BASE}/queue/${venueId}`);
    const j = await r.json();
    setQueue(j.queue ?? []);
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "Inter, system-ui, sans-serif" }}>
      <h1>Vote · {venueId}</h1>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h3>Search & add</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search songs..." style={{ flex: 1 }} />
          <button onClick={search} disabled={loading}>Search</button>
        </div>
        <ul>
          {res.map(s => (
            <li key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
              {s.albumArt ? <img src={s.albumArt} width={40} height={40} /> : null}
              <div style={{ flex: 1 }}>
                <div>{s.title}</div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>{s.artist}</div>
              </div>
              <button onClick={() => addSong(s)}>Add</button>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h3>Queue</h3>
        <button onClick={loadQueue}>Reload queue</button>
        <ul>
          {queue.map(qi => (
            <li key={qi.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
              {qi.albumArt ? <img src={qi.albumArt} width={40} height={40} /> : null}
              <div style={{ flex: 1 }}>
                <div>{qi.title}</div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>{qi.artist}</div>
              </div>
              <div style={{ width: 60, textAlign: "right" }}>{qi.hype ?? 0} 🔥</div>
              <button onClick={() => vote(qi.id)}>Vote</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
