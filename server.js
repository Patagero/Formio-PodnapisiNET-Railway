import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

// Load manifest (without assert)
const manifest = JSON.parse(fs.readFileSync("./manifest.json", "utf8"));

const app = express();
app.use(express.json());

// ============================================================================
// IMDB TITLE FETCHER (OMDb API)
// ============================================================================
async function getImdbTitle(imdbId) {
  try {
    const url = `https://www.omdbapi.com/?i=${imdbId}&apikey=564727fa`;
    const r = await axios.get(url);
    return r.data.Title || null;
  } catch {
    return null;
  }
}

// ============================================================================
// PODNAPISI SCRAPER — NO PUPPETEER
// ============================================================================
async function scrapeSubtitles(keyword) {
  const url =
    "https://www.podnapisi.net/sl/subtitles/search/?" +
    new URLSearchParams({
      keywords: keyword,
      language: "sl",
    });

  console.log("🌍 URL:", url);

  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const results = [];

  $(".subtitle-entry").each((i, el) => {
    const link = $(el).find("a").attr("href");
    const download = $(el).find("a.download").attr("href");

    if (!link) return;

    results.push({
      page: "https://www.podnapisi.net" + link,
      download: download ? "https://www.podnapisi.net" + download : null,
    });
  });

  return results;
}

// ============================================================================
// DOWNLOAD ZIP → EXTRACT SRT
// ============================================================================
async function downloadAndExtract(url) {
  console.log("⬇️ Download ZIP:", url);

  const response = await axios.get(url, {
    responseType: "arraybuffer",
  });

  const AdmZip = (await import("adm-zip")).default;
  const zip = new AdmZip(response.data);

  for (const entry of zip.getEntries()) {
    if (entry.entryName.endsWith(".srt")) {
      return zip.readAsText(entry);
    }
  }

  return null;
}

// ============================================================================
// MAIN SUBTITLES ROUTER (/subtitles/...)
// ============================================================================
app.get("/subtitles/:type/:imdbId.json", async (req, res) => {
  try {
    const raw = req.params.imdbId;

    let season = null;
    let episode = null;
    let imdbId = raw;

    if (raw.includes(":")) {
      const p = raw.split(":");
      imdbId = p[0];
      season = p[1];
      episode = p[2];
    }

    console.log("🎬 Request:", raw);

    const title = await getImdbTitle(imdbId);
    if (!title) return res.json({ subtitles: [] });

    console.log(`🎬 IMDb: ${imdbId} → ${title}`);

    const subs = await scrapeSubtitles(title);

    if (!subs.length) return res.json({ subtitles: [] });

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

    res.json({ subtitles: collected });
  } catch (err) {
    console.log("❌ ERROR:", err);
    res.json({ subtitles: [] });
  }
});

// ============================================================================
// MANIFEST + ROOT
// ============================================================================
app.get("/manifest.json", (req, res) => res.json(manifest));
app.get("/", (req, res) => res.redirect("/manifest.json"));

// ============================================================================
// START SERVER (Railway)
// ============================================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("===============================================");
  console.log(`🚀 Podnapisi Railway running on port ${PORT}`);
  console.log("===============================================");
});
