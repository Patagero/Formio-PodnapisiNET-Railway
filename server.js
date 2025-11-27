import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send("✓ Podnapisi.NET FAST addon running!");
});

// ---- MANIFEST ----
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/manifest.json", (req, res) => {
  const m = fs.readFileSync(path.join(__dirname, "manifest.json"));
  res.setHeader("Content-Type", "application/json");
  res.send(m);
});

// ---- SUBTITLES API ----
app.get("/subtitles/:type/:imdbId.json", async (req, res) => {
  const imdbId = req.params.imdbId.replace("tt", "");

  try {
    const url = `https://podnapisi.net/subtitles/search/?keywords=${imdbId}&language=sl`;
    const html = await fetch(url).then(r => r.text());

    const $ = cheerio.load(html);

    const results = [];

    $(".subtitle-entry").each((i, el) => {
      const link = $(el).find("a").attr("href");
      const title = $(el).find(".release").text().trim();

      if (!link) return;

      results.push({
        id: `https://podnapisi.net${link}`,
        url: `https://podnapisi.net${link}`,
        lang: "sl",
        downloads: 100,
        name: title || "Slovenski podnapis",
      });
    });

    res.json({ subtitles: results });

  } catch (err) {
    res.json({ subtitles: [] });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Podnapisi.NET FAST ready on port ${PORT}`);
});
