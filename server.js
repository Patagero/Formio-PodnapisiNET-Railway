import express from "express";
import fetch from "node-fetch";
import cheerio from "cheerio";
import fs from "fs";
import AdmZip from "adm-zip";

// Load manifest WITHOUT ESM assert
const manifest = JSON.parse(fs.readFileSync("./manifest.json", "utf8"));

const app = express();
app.use(express.json());

// ============================================================================
// GET TITLE FROM IMDB
// ============================================================================

async function getImdbTitle(imdbId) {
  try {
    const url = `https://www.omdbapi.com/?i=${imdbId}&apikey=564727fa`;
    const r = await fetch(url);
    const j = await r.json();
    return j.Title || null;
  } catch (err) {
    console.log("❌ IMDb fetch error:", err);
    return null;
  }
}

// ============================================================================
// SCRAPER (NO PUPPETEER)
// ============================================================================

async function scrapeSubtitles(keyword) {
  const url =
    "https://www.podnapisi.net/sl/subtitles/search/?" +
    new URLSearchParams({
      keywords: keyword,
      language: "sl",
    });

  console.log("🌍 SCRAPING:", url);

  const resp = await fetch(url);
  const html = await resp.text();
  const $ = cheerio.load(html);

  const results = [];

  $(".subtitle-entry").each((i, el) => {
    const link = $(el).find("a").attr("href");
    if (!link) return;

    const download = $(el).find("a.download").attr("href");

    results.push({
      page: "https://www.podnapisi.net" + link,
      download: download ? "https://www.podnapisi.net" + download : null,
    });
  });

  console.log(`➡️ Najdenih ${results.length} rezultatov`);

  return results;
}

// ============================================================================
// ZIP → SRT EXTRACTION
// ============================================================================

async function downloadAndExtract(url) {
  console.log("⬇️ Fetch ZIP:", url);

  try {
    const r = await fetch(url);
    const buf = Buffer.from(await r.arrayBuffer());

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
// API ROUTE
// ============================================================================

app.get("/subtitles/:type/:imdbId.json", async (req, res) => {
  try {
    const imdbIdRaw = req.params.imdbId;

    let season = null;
    let episode = null;
    let imdbId = imdbIdRaw;

    // Detect series format: tt1234567:1:1
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

    return res.json({ subtitles: collected });
  } catch (e) {
    console.log("❌ ROUTE ERROR:", e);
    return res.json({ subtitles: [] });
  }
});

// ============================================================================
// MANIFEST & SERVER START
// ============================================================================

app.get("/manifest.json", (req, res) => res.json(manifest));
app.get("/", (req, res) => res.redirect("/manifest.json"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("==================================================");
  console.log(
    ` FORMIO PODNAPISI.NET 🇸🇮 — Railway running on port ${PORT}`
  );
  console.log("==================================================");
});
