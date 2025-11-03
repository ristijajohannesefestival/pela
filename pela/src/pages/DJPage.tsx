import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const BASE = "https://eahgekmtuyvclxegqolf.supabase.co/functions/v1/make-server-d5eddf57";

type Device = { id: string; name: string; type: string; is_active: boolean; is_restricted: boolean };
type NowPlaying = { title: string; artist: string; albumArt?: string; id?: string; uri?: string; startedAt?: number } | null;

export default function DJPage() {
  const { venueId = "demo-venue" } = useParams();
  const [linked, setLinked] = useState<boolean>(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>(null);
  const audienceUrl = useMemo(() => `${window.location.origin}/v/${venueId}`, [venueId]);

  useEffect(() => {
    // kui callbackist tuldi ?linked=1
    const u = new URL(window.location.href);
    if (u.searchParams.get("linked") === "1") setLinked(true);
  }, []);

  async function connectSpotify() {
    window.location.href = `${BASE}/spotify/login?venueId=${venueId}`;
  }

  async function refreshDevices() {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/spotify/devices/${venueId}`);
      const j = await r.json();
      if (j.devices) setDevices(j.devices);
    } finally {
      setLoading(false);
    }
  }

  async function selectDevice() {
    if (!deviceId) return alert("Choose a device first.");
    setLoading(true);
    try {
      await fetch(`${BASE}/spotify/select-device`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, deviceId }),
      });
      alert("Device saved for this venue.");
    } finally {
      setLoading(false);
    }
  }

  async function playNext() {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/play-next/${venueId}`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) {
        alert(j.error ?? "Failed to play next");
      } else {
        await loadNowPlaying();
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadNowPlaying() {
    const r = await fetch(`${BASE}/now-playing/${venueId}`);
    const j = await r.json();
    setNowPlaying(j.nowPlaying ?? null);
  }

  useEffect(() => {
    loadNowPlaying();
    const t = setInterval(loadNowPlaying, 5000);
    return () => clearInterval(t);
  }, [venueId]);

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "Inter, system-ui, sans-serif" }}>
      <h1>DJ · {venueId}</h1>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h3>1) Link Spotify (Authorization Code)</h3>
        <p>Status: {linked ? "✅ linked" : "❌ not linked yet"}</p>
        <button onClick={connectSpotify}>Connect Spotify</button>
      </section>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h3>2) Pick playback device (desktop/mobiili Spotify)</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={refreshDevices} disabled={loading}>Refresh devices</button>
          <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
            <option value="">-- select device --</option>
            {devices.map(d => (
              <option key={d.id} value={d.id}>
                {d.name || d.type}{d.is_active ? " (active)" : ""}
              </option>
            ))}
          </select>
          <button onClick={selectDevice} disabled={!deviceId || loading}>Use this device</button>
        </div>
        <p style={{ fontSize: 12, opacity: 0.7 }}>NB! Ava Spotify äpp ja hoia seade online/active.</p>
      </section>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h3>3) Control</h3>
        <button onClick={playNext} disabled={loading}>▶️ Play next</button>
        <button onClick={loadNowPlaying} style={{ marginLeft: 8 }}>Reload Now Playing</button>
        <div style={{ marginTop: 12 }}>
          <strong>Now playing:</strong>
          {nowPlaying ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
              {nowPlaying.albumArt ? <img src={nowPlaying.albumArt} width={56} height={56} /> : null}
              <div>
                <div>{nowPlaying.title}</div>
                <div style={{ opacity: 0.7 }}>{nowPlaying.artist}</div>
              </div>
            </div>
          ) : <div style={{ opacity: 0.7 }}>—</div>}
        </div>
      </section>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h3>QR / Audience link</h3>
        <p>Jaga külalistele: <a href={audienceUrl}>{audienceUrl}</a></p>
      </section>
    </div>
  );
}
