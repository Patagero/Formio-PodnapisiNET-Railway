import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs";
import AdmZip from "adm-zip";

const manifest = JSON.parse(fs.readFileSync("./manifest.json", "utf8"));

const app = express();
app.use(express.json());

// ---------------------------------------------------------------------
// FETCH IMDB TITLE
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// SCRAPE PODNAPISI.NET
// ---------------------------------------------------------------------
async function scrapeSubtitles(keyword) {
  const url =
    "https://www.podnapisi.net/sl/subtitles/search/?" +
    new URLSearchParams({
      keywords: keyword,
      language: "sl",
    });

  console.log("🌍 SCRAPING URL:", url);

  const resp = await fetch(url);
  const html = await resp.text();
  const $ = cheerio.load(html);

  const results = [];

  $(".subtitle-entry").each((i, el) => {
    const a = $(el).find("a");
    const page = a.attr("href");
    const dl = $(el).find("a.download").attr("href");

    if (!page) return;

    results.push({
      page: "https://www.podnapisi.net" + page,
      download: dl ? "https://www.podnapisi.net" + dl : null,
    });
  });

  return results;
}

// ---------------------------------------------------------------------
// ZIP → SRT
// ---------------------------------------------------------------------
async function downloadAndExtract(url) {
  console.log("⬇️ ZIP:", url);
  try {
    const r = await fetch(url);
    const buf = Buffer.from(await r.arrayBuffer());
    const zip = new AdmZip(buf);

    for (const e of zip.getEntries()) {
      if (e.entryName.endsWith(".srt")) {
        return zip.readAsText(e);
      }
    }
  } catch (err) {
    console.log("❌ ZIP ERROR:", err.message);
  }
  return null;
}

// ---------------------------------------------------------------------
// ROUTE: /subtitles/:type/:imdbId.json
// ---------------------------------------------------------------------
app.get("/subtitles/:type/:imdbId.json", async (req, res) => {
  try {
    const raw = req.params.imdbId;

    let imdb = raw;
    let S = null;
    let E = null;

    if (raw.includes(":")) {
      const p = raw.split(":");
      imdb = p[0];
      S = p[1];
      E = p[2];
    }

    console.log("🎬 Request:", raw);

    const title = await getImdbTitle(imdb);
    if (!title) return res.json({ subtitles: [] });

    console.log(`🎬 IMDb: ${imdb} → ${title}`);

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
  } catch (err) {
    console.log("❌ FATAL:", err);
    return res.json({ subtitles: [] });
  }
});

// ---------------------------------------------------------------------
// MANIFEST
// ---------------------------------------------------------------------
app.get("/manifest.json", (req, res) => res.json(manifest));
app.get("/", (req, res) => res.redirect("/manifest.json"));

// ---------------------------------------------------------------------
// START SERVER (IMPORTANT FOR RAILWAY)
// ---------------------------------------------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Railway server running on ${PORT}`)
);
