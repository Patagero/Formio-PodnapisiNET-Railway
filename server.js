import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 8080;

// ---- MANIFEST ----
const manifest = {
  id: "podnapisinet-sl-fast",
  version: "1.0.0",
  name: "Podnapisi.NET (SL) – FAST",
  description: "Hitri slovenski podnapisi iz Podnapisi.NET (brez Puppeteer)",
  types: ["movie", "series"],
  catalogs: [],
  resources: ["subtitles"],
  idPrefixes: ["tt"]
};

// Serve manifest.json
app.get("/manifest.json", (req, res) => {
  res.json(manifest);
});

// Root
app.get("/", (req, res) => {
  res.send("✓ Podnapisi.NET FAST addon running!");
});

// ---- SUBTITLES FUNCTION ----
app.get("/subtitles/:type/:id.json", async (req, res) => {
  const imdb = req.params.id.replace("tt", "");

  const searchUrl = `https://podnapisi.net/subtitles/search/old?sXML=1&sL=8&sK=${imdb}`;

  try {
    const r = await fetch(searchUrl);
    const xml = await r.text();

    // Super simplifikacija: če ima IMDB podnapise, dodamo link.
    const subtitles = [];

    if (xml.includes("<subtitle")) {
      // Podnapisi.NET direct download link
      subtitles.push({
        id: "sl",
        url: `https://podnapisi.net/subtitles/search/old?sK=${imdb}&sJ=0&sXML=0`,
        lang: "Slovenian",
        format: "srt"
      });
    }

    res.json(subtitles);
  } catch (err) {
    console.error("Error:", err);
    res.json([]);
  }
});

app.listen(PORT, () =>
  console.log(`Podnapisi.NET FAST addon running on ${PORT}`)
);
