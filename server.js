import express from "express";
import fetch from "node-fetch";
import cheerio from "cheerio";
import manifest from "./manifest.json" assert { type: "json" };
import AdmZip from "adm-zip";

const app = express();
app.use(express.json());

// ============================================================================
// IMDB TITLE FETCH
// ============================================================================
async function getImdbTitle(imdbId) {
  try {
    const url = `https://www.omdbapi.com/?i=${imdbId}&apikey=564727fa`;
    const r = await fetch(url);
    const j = await r.json();
    return j.Title || null;
  } catch {
    return null;
  }
}

// ============================================================================
// PODNAPISI SCRAPER (NO PUPPETEER)
// ============================================================================
async function scrapeSubtitles(keyword) {
  const url =
    "https://www.podnapisi.net/sl/subtitles/search/?" +
    new URLSearchParams({
      keywords: keyword,
      language: "sl",
    });

  console.log("🌍 PODNAPISI URL:", url);

  const resp = await fetch(url);
  const html = await resp.text();
  const $ = cheerio.load(html);

  // Collect subtitle entries
  const results = [];

  $(".subtitle-entry").each((i, el) => {
    const link = $(el).find("a").attr("href");
    if (!link) return;

    // Direct download link (new Podnapisi format)
    const download = $(el).find("a.download").attr("href");

    results.push({
      page: "https://www.podnapisi.net" + link,
      download: download
        ? "https://www.podnapisi.net" + download
        : null,
    });
  });

  return results;
}

// ============================================================================
// ZIP → SRT EXTRACT
// ============================================================================
async function downloadAndExtract(url) {
  console.log(⬇️ Fetch ZIP:", url);

  const r = await fetch(url);
  const buf = Buffer.from(await r.arrayBuffer());

  try {
    const zip = new AdmZip(buf);
    const entries = zip.getEntries();

    for (const e of entries) {
      if (e.entryName.endsWith(".srt")) {
        return zip.readAsText(e);
      }
    }
  } catch (e) {
    console.log("❌ ZIP ERROR:", e.message);
  }

  return null;
}

// ============================================================================
// ROUTER
// ============================================================================
app.get("/subtitles/:type/:imdbId.json", async (req, res) => {
  try {
    const imdbIdRaw = req.params.imdbId;

    // Detect SxxEyy for series
    let season = null;
    let episode = null;
    let imdbId = imdbIdRaw;

    if (imdbIdRaw.includes(":")) {
      const parts = imdbIdRaw.split(":");
      imdbId = parts[0];
      season = parts[1];
      episode = parts[2];
    }

    console.log("🎬 Request:", imdbIdRaw);

    const title = await getImdbTitle(imdbId);
    if (!title) return res.json({ subtitles: [] });

    console.log(`🎬 IMDb: ${imdbId} → ${title}`);

    const subs = await scrapeSubtitles(title);

    if (!subs.length) {
      console.log("❌ No subtitles found");
      return res.json({ subtitles: [] });
    }

    const collected = [];

    for (const s of subs) {
      if (!s.download) continue;

      const srt = await downloadAndExtract(s.download);
      if (!srt) continue;

      collected.push({
        lang: "sl",
        srt,
        source: s.download,
      });
    }

    return res.json({
      subtitles: collected,
    });
  } catch (e) {
    console.log("❌ FATAL ERROR:", e);
    return res.json({ subtitles: [] });
  }
});

// ============================================================================
// MANIFEST & ROOT
// ============================================================================
app.get("/manifest.json", (req, res) => res.json(manifest));
app.get("/", (req, res) => res.redirect("/manifest.json"));

// ============================================================================
// START — RAILWAY NEEDS THIS!!!
// ============================================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("==================================================");
  console.log(` FORMIO PODNAPISI.NET 🇸🇮 — Railway running on port ${PORT}`);
  console.log("==================================================");
});
