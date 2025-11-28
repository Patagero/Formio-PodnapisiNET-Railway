import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { load } from "cheerio";

const app = express();
app.use(cors());
app.use(express.json());

// Manifest za Stremio
const manifest = {
  id: "podnapisinet-fast-sl",
  version: "1.0.0",
  name: "Podnapisi.NET FAST (SL)",
  description: "Hitri slovenski podnapisi iz Podnapisi.NET brez Puppeteerja",
  types: ["movie", "series"],
  resources: ["subtitles"],
  idPrefixes: ["tt"]
};

// 📄 Endpoint za manifest
app.get("/manifest.json", (req, res) => {
  res.json(manifest);
});

// 📂 Endpoint za podnapise
app.get("/subtitles/:type/:id/:extra?.json", async (req, res) => {
  const imdbId = req.params.id;
  console.log("==================================================");
  console.log("🎬 Zahteva za IMDb:", imdbId);

  try {
    // OMDb API za pridobitev naslova
    const omdbRes = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=thewdb`);
    const omdbData = await omdbRes.json();
    const title = omdbData?.Title || imdbId;
    console.log(`🎬 IMDb → ${title}`);

    // Podnapisi.net search
    const searchUrl = `https://www.podnapisi.net/sl/subtitles/search/?keywords=${encodeURIComponent(title)}&language=sl`;
    console.log("🌍 Iščem:", searchUrl);

    const html = await (await fetch(searchUrl)).text();
    const $ = load(html);

    const results = [];
    $("table.table tbody tr").each((i, row) => {
      const link = $(row).find("a[href*='/download']").attr("href");
      const name = $(row).find("a[href*='/download']").text().trim();
      if (link) {
        results.push({
          id: `fast-${i}`,
          url: "https://www.podnapisi.net" + link,
          lang: "sl",
          name: "🇸🇮 " + name
        });
      }
    });

    console.log(`✅ Najdenih ${results.length} podnapisov`);
    res.json({ subtitles: results });
  } catch (err) {
    console.error("⚠️ Napaka:", err.message);
    res.json({ subtitles: [] });
  }
});

// 🚀 Zagon strežnika
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("==================================================");
  console.log("✅ FAST Podnapisi.NET 🇸🇮 aktiven");
  console.log(`🌐 Manifest: http://127.0.0.1:${PORT}/manifest.json`);
  console.log("==================================================");
});
