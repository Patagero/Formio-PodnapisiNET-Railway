import express from "express";
import cors from "cors";
import { load } from "cheerio";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;

const manifest = {
  id: "org.podnapisi.fastsl",
  version: "1.0.0",
  name: "Podnapisi.NET FAST (SL)",
  description: "Slovenski podnapisi iz Podnapisi.NET (HTML scrape + OMDb title)",
  types: ["movie", "series"],
  resources: ["subtitles"],
  idPrefixes: ["tt"]
};

app.get("/manifest.json", (req, res) => res.json(manifest));

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .replace(/č/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/[^a-z0-9]+/g, "");
}

function parseExtra(extra) {
  if (!extra) return {};
  const params = {};
  extra.split("&").forEach(part => {
    const [k, v] = part.split("=");
    if (k) params[k] = decodeURIComponent(v || "");
  });
  return params;
}

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "sl-SI,sl;q=0.9,en-US;q=0.7,en;q=0.6",
  "Referer": "https://www.podnapisi.net/"
};

async function fetchText(url) {
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.text();
}

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.json();
}

app.get("/subtitles/:type/:id/:extra?.json", async (req, res) => {
  const type = req.params.type;      // movie|series
  const imdbId = req.params.id;      // tt...
  const extraRaw = req.params.extra || "";
  const extra = parseExtra(extraRaw);

  console.log("==================================================");
  console.log(`🎬 Request: type=${type}, imdb=${imdbId}, extra=${extraRaw}`);

  try {
    // 1) Title from OMDb
    const omdb = await fetchJson(`https://www.omdbapi.com/?i=${imdbId}&apikey=thewdb`);
    const title = omdb?.Title || imdbId;
    const year = (omdb?.Year || "").replace(/\D+/g, "");
    console.log(`🎬 OMDb: ${title} (${year || "—"})`);

    // 2) Search Podnapisi
    const searchUrl =
      `https://www.podnapisi.net/sl/subtitles/search/?keywords=${encodeURIComponent(title)}&language=sl`;

    console.log(`🌍 Search: ${searchUrl}`);
    const html = await fetchText(searchUrl);
    const $ = load(html);

    // 3) Parse results
    const raw = [];

    // Podnapisi pogosto kaže rezultate v tabeli
    $("table.table tbody tr").each((i, row) => {
      const a = $(row).find("a[href*='/download']");
      const href = a.attr("href");
      const name = a.text().trim();
      if (!href || !name) return;

      const full = href.startsWith("http") ? href : `https://www.podnapisi.net${href}`;
      raw.push({ index: i + 1, link: full, title: name });
    });

    // Fallback regex
    if (raw.length === 0) {
      const regex = /href="([^"]*\/download)"[^>]*>([^<]+)<\/a>/g;
      let m;
      while ((m = regex.exec(html)) !== null) {
        const link = m[1].startsWith("http") ? m[1] : `https://www.podnapisi.net${m[1]}`;
        raw.push({ index: raw.length + 1, link, title: (m[2] || "").trim() });
      }
    }

    console.log(`✅ Found raw: ${raw.length}`);

    // 4) Filter tolerant
    const cleanTitle = normalize(title);

    const filtered = raw.filter(r => {
      const t = r.title || "";
      const n = normalize(t);

      const titleOk =
        n.includes(cleanTitle) ||
        n.startsWith(cleanTitle) ||
        (year && n.includes(year) && n.includes(cleanTitle)) ||
        n.includes(cleanTitle.slice(0, 4));

      // malo grob filter za movie (da ne pobere serij)
      const isWrong = type === "movie" && /(season|episode|s\d{1,2}e\d{1,2}|serija)/i.test(t);

      return titleOk && !isWrong;
    });

    console.log(`🧩 After filter: ${filtered.length}`);

    if (!filtered.length) return res.json({ subtitles: [] });

    // 5) Return to Stremio
    const subtitles = filtered.slice(0, 30).map((r, i) => {
      const displayName = extra.filename
        ? `🇸🇮 ${extra.filename} → ${r.title}`
        : `🇸🇮 ${r.title}`;

      return {
        id: `podnapisi-fast-${imdbId}-${i + 1}`,
        url: r.link,       // Podnapisi download je ZIP -> Stremio ga zna potegniti
        lang: "sl",
        name: displayName
      };
    });

    res.json({ subtitles });
  } catch (err) {
    console.error("❌ ERROR:", err.message);
    res.json({ subtitles: [] });
  }
});

app.get("/", (req, res) => res.send("✅ Podnapisi.NET FAST (SL) Stremio addon running"));

app.listen(PORT, "0.0.0.0", () => {
  console.log("==================================================");
  console.log(`✅ Running on port ${PORT}`);
  console.log("==================================================");
});