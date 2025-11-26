import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";
import fetch from "node-fetch";

// --- Fix za __dirname v ES modu ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Naloži manifest.json ---
const manifestPath = path.join(__dirname, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

// --- Express server ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  return res.json({
    status: "OK",
    message: "Podnapisi.NET Addon running",
    manifest,
  });
});

// --- Glavna API pot ---
//  /subtitles/:imdb/:season/:episode
app.get("/subtitles/:imdb/:season/:episode", async (req, res) => {
  const { imdb, season, episode } = req.params;

  try {
    const url = `https://www.podnapisi.net/sl/subtitles/search/?keywords=&movie-imdb=${imdb}&seasons=${season}&episodes=${episode}`;

    const response = await fetch(url);
    const html = await response.text();

    const $ = cheerio.load(html);

    let results = [];

    $(".subtitle-entry").each((i, el) => {
      const lang = $(el).find(".flag").attr("title") || "";
      const downloadUrl = $(el).find(".download a").attr("href") || "";

      if (downloadUrl) {
        results.push({
          lang,
          url: `https://www.podnapisi.net${downloadUrl}`,
        });
      }
    });

    return res.json({
      imdb,
      season,
      episode,
      count: results.length,
      subtitles: results,
    });
  } catch (err) {
    console.error("Subtitle fetch error:", err);
    return res.status(500).json({ error: "Failed to load subtitles" });
  }
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Addon running on port ${PORT}`);
});
