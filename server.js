import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

const MANIFEST = {
  id: "podnapisinet-sl-fast",
  version: "1.0.0",
  name: "Podnapisi.NET FAST (SL Only)",
  description: "Hitri Stremio podnapisi brez Puppeteer – samo slovenski.",
  logo: "https://www.podnapisi.net/static/img/logo.svg",
  contactEmail: "info@example.com",
  Catalogs: [],
  resources: ["subtitles"],
  types: ["movie", "series"],
};

// 🔥 manifest route (najbolj pomembno!)
app.get("/manifest.json", (req, res) => {
  res.json(MANIFEST);
});

// 🔥 subtitles endpoint (FAST, SL ONLY)
app.get("/subtitles/:type/:id.json", async (req, res) => {
  const { id } = req.params;

  try {
    const url = `https://podnapisi.net/subtitles/search/?keywords=${id}&language=sl`;
    const response = await fetch(url);
    const html = await response.text();

    const results = [];

    // najde SL podnapise (FAST naive parse)
    const regex = /href="(\/subtitles\/\d+\/[^"]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      results.push({
        id: "sl",
        lang: "slv",
        url: "https://podnapisi.net" + match[1],
      });
    }

    res.json({ subtitles: results });
  } catch (err) {
    console.error("Subtitle error:", err);
    res.json({ subtitles: [] });
  }
});

// root test
app.get("/", (req, res) => {
  res.send("✓ Podnapisi.NET FAST addon running!");
});

// Railway port
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("FAST addon listening on port", PORT));
