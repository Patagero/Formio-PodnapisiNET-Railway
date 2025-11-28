import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8080;

const manifest = {
  id: "podnapisinet-sl-fast",
  version: "1.0.0",
  name: "Podnapisi.NET FAST (SL)",
  description: "FAST subtitles scraper (Slovenian only).",
  types: ["movie", "series"],
  logo: "https://www.podnapisi.net/static/media/logo.c41e.png",
  catalogs: [],
  resources: ["subtitles"],
  idPrefixes: ["tt"]
};

// Serve manifest.json
app.get("/manifest.json", (req, res) => {
  res.json(manifest);
});

// Fast subtitle scraper route
app.get("/subtitles/:type/:imdbId.json", async (req, res) => {
  const imdbId = req.params.imdbId;
  const url = `https://podnapisi.net/subtitles/search/advanced?keywords=${imdbId}&language=sl`;

  try {
    const html = await fetch(url).then(r => r.text());
    const $ = cheerio.load(html);

    let out = [];

    $(".subtitle-entry").each((i, el) => {
      const title = $(el).find(".release").text().trim();
      const link = $(el).find("a").attr("href");

      if (!link) return;

      out.push({
        id: imdbId,
        type: "movie",
        lang: "slv",
        url: "https://podnapisi.net" + link,
        filename: title
      });
    });

    res.json(out);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
});

// Root check
app.get("/", (req, res) => {
  res.send("✓ Podnapisi.NET FAST addon running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Podnapisi.NET FAST running on port ${PORT}`);
});
