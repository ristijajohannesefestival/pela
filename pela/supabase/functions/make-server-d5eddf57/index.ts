import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.ts";

const app = new Hono();

// --- CORS whitelist
const ALLOWED = new Set<string>(["http://localhost:5173", "https://pela.vercel.app", "https://pela.xyz"]);

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => (origin && ALLOWED.has(origin) ? origin : false),
    allowHeaders: ["Content-Type", "Authorization", "x-client-info", "apikey"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// --- Loo alam-app ja defineeri KÕIK route’id selle peale:
const api = new Hono();

// juurtest
api.get("/", (c) => c.text("ok"));

// Health
api.get("/health", (c) => c.json({ status: "ok" }));

// Queue
api.get("/queue/:venueId", async (c) => {
  try {
    const venueId = c.req.param("venueId");
    const queueItems = await kv.getByPrefix(`queue:${venueId}:`);
    queueItems.sort((a: any, b: any) => (b.hype ?? 0) - (a.hype ?? 0));
    return c.json({ queue: queueItems });
  } catch (e) {
    console.error("Error fetching queue:", e);
    return c.json({ error: "Failed to fetch queue" }, 500);
  }
});

// Now playing
api.get("/now-playing/:venueId", async (c) => {
  try {
    const venueId = c.req.param("venueId");
    const nowPlaying = await kv.get(`nowplaying:${venueId}`);
    return c.json({ nowPlaying: nowPlaying || null });
  } catch (e) {
    console.error("Error fetching now playing:", e);
    return c.json({ error: "Failed to fetch now playing" }, 500);
  }
});

// Vote
api.post("/vote", async (c) => {
  try {
    const { venueId, songId, sessionId } = await c.req.json();
    if (!venueId || !songId || !sessionId) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    const voteKey = `vote:${venueId}:${sessionId}:${songId}`;
    if (await kv.get(voteKey)) return c.json({ error: "Already voted for this song" }, 400);
    await kv.set(voteKey, true);

    const queueKey = `queue:${venueId}:${songId}`;
    const song = await kv.get(queueKey);
    if (!song) return c.json({ error: "Song not found in queue" }, 404);

    const updatedSong = { ...song, hype: (song.hype ?? 0) + 1 };
    await kv.set(queueKey, updatedSong);
    return c.json({ success: true, hype: updatedSong.hype });
  } catch (e) {
    console.error("Error voting for song:", e);
    return c.json({ error: "Failed to vote for song" }, 500);
  }
});

// Add song
api.post("/add-song", async (c) => {
  try {
    const { venueId, sessionId, song } = await c.req.json();
    if (!venueId || !sessionId || !song?.title || !song?.artist) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    const sessionKey = `session:${venueId}:${sessionId}`;
    const session = await kv.get(sessionKey);
    const cooldownMs = 30 * 60 * 1000;
    if (session?.lastAddedAt) {
      const since = Date.now() - session.lastAddedAt;
      if (since < cooldownMs) {
        const remainingMinutes = Math.ceil((cooldownMs - since) / 60000);
        return c.json(
          { error: "Cooldown active", cooldownMinutes: remainingMinutes },
          429,
        );
      }
    }
    const songId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const queueKey = `queue:${venueId}:${songId}`;
    const newSong = {
      id: songId, title: song.title, artist: song.artist,
      albumArt: song.albumArt ?? "", hype: 0, addedAt: Date.now(),
    };
    await kv.set(queueKey, newSong);
    await kv.set(sessionKey, { venueId, sessionId, lastAddedAt: Date.now() });
    return c.json({ success: true, song: newSong });
  } catch (e) {
    console.error("Error adding song to queue:", e);
    return c.json({ error: "Failed to add song to queue" }, 500);
  }
});

// Spotify token helper
async function getSpotifyAccessToken(): Promise<string | null> {
  try {
    const cached = await kv.get("spotify:access_token");
    if (cached?.token && cached?.expiresAt > Date.now()) return cached.token;

    const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
    const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      console.error("Spotify credentials not configured");
      return null;
    }

    const resp = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: "grant_type=client_credentials",
    });
    if (!resp.ok) {
      console.error("Failed to get Spotify token:", await resp.text());
      return null;
    }
    const { access_token, expires_in } = await resp.json();
    const expiresAt = Date.now() + (expires_in - 300) * 1000;
    await kv.set("spotify:access_token", { token: access_token, expiresAt });
    return access_token;
  } catch (e) {
    console.error("Error getting Spotify access token:", e);
    return null;
  }
}

// Spotify search
api.get("/search-spotify", async (c) => {
  try {
    const query = c.req.query("q");
    if (!query) return c.json({ error: "Query parameter required" }, 400);

    const key = "ratelimit:spotify:search";
    const rl = await kv.get(key);
    const now = Date.now();
    if (rl?.count && rl?.resetAt > now) {
      if (rl.count >= 60) {
        const wait = Math.ceil((rl.resetAt - now) / 1000);
        return c.json({ error: `Too many searches. Please wait ${wait} seconds.`, retryAfter: wait }, 429);
      }
      await kv.set(key, { count: rl.count + 1, resetAt: rl.resetAt });
    } else {
      await kv.set(key, { count: 1, resetAt: now + 60_000 });
    }

    const token = await getSpotifyAccessToken();
    if (!token) {
      return c.json({ error: "Spotify API not configured. Please add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET." }, 500);
    }

    const resp = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!resp.ok) {
      const text = await resp.text();
      console.error("Spotify search failed:", text);
      if (resp.status === 401) {
        await kv.del("spotify:access_token");
        return c.json({ error: "Authentication expired. Please try again." }, 401);
      }
      return c.json({ error: "Failed to search Spotify" }, 500);
    }

    const data = await resp.json();
    const results = (data.tracks.items ?? []).map((t: any) => ({
      id: t.id,
      title: t.name,
      artist: t.artists.map((a: any) => a.name).join(", "),
      albumArt: t.album.images?.[0]?.url ?? "",
    }));
    return c.json({ results });
  } catch (e) {
    console.error("Error searching Spotify:", e);
    return c.json({ error: "Failed to search Spotify" }, 500);
  }
});

// Init demo
api.post("/init-demo/:venueId", async (c) => {
  try {
    const venueId = c.req.param("venueId");
    const existing = await kv.getByPrefix(`queue:${venueId}:`);
    if (existing.length > 0) return c.json({ message: "Venue already initialized" });

    const demoSongs = [
      { id: "demo-1", title: "adore u", artist: "Fred again..", albumArt: "https://images.unsplash.com/photo-1571766752116-63b1e6514b53?w=300&h=300&fit=crop", hype: 127, addedAt: Date.now() - 1_000_000 },
      { id: "demo-2", title: "Heat Waves", artist: "Glass Animals", albumArt: "https://images.unsplash.com/photo-1622224408917-9dfb43de2cd4?w=300&h=300&fit=crop", hype: 89, addedAt: Date.now() - 800_000 },
      { id: "demo-3", title: "Parem veelgi", artist: "Tanel Padar", albumArt: "https://images.unsplash.com/photo-1629426958038-a4cb6e3830a0?w=300&h=300&fit=crop", hype: 56, addedAt: Date.now() - 600_000 },
      { id: "demo-4", title: "Blinding Lights", artist: "The Weeknd", albumArt: "https://images.unsplash.com/photo-1606224534096-fcd6bb9a2018?w=300&h=300&fit=crop", hype: 43, addedAt: Date.now() - 400_000 },
    ];
    for (const s of demoSongs) await kv.set(`queue:${venueId}:${s.id}`, s);
    await kv.set(`nowplaying:${venueId}`, {
      title: "Starboy",
      artist: "The Weeknd ft. Daft Punk",
      albumArt: "https://images.unsplash.com/photo-1571766752116-63b1e6514b53?w=300&h=300&fit=crop",
    });
    return c.json({ success: true, message: "Demo data initialized" });
  } catch (e) {
    console.error("Error initializing demo venue:", e);
    return c.json({ error: "Failed to initialize demo venue" }, 500);
  }
});

// M Ä N G I T A K S E  KAHEL TEEL: / ja /make-server-d5eddf57
app.route("/", api);
app.route("/make-server-d5eddf57", api);

Deno.serve(app.fetch);
