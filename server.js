import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 10000;
const BASE_URL = process.env.BASE_URL || "https://formio-podnapisinetv3.onrender.com";

/* ================= GLOBAL HIT LOGGER ================= */

app.use((req, res, next) => {
  console.log("📡 HIT:", req.method, req.url);
  next();
});

/* ================= MANIFEST ================= */

const manifest = {
  id: "org.podnapisi.final.sl.v6", // ⬅️ NOV ID (ZEL0 POMEMBNO)
  version: "6.0.0",
  name: "Podnapisi.NET 🇸🇮 FINAL (Stremio)",
  description: "Slovenski podnapisi iz Podnapisi.NET (Stremio test build)",
  resources: ["subtitles"],
  types: ["movie", "series"],
  idPrefixes: ["tt"]
};

app.get("/manifest.json", (req, res) => {
  res.json(manifest);
});

/* ================= SUBTITLES ================= */

app.get("/subtitles/:type/:id.json", async (req, res) => {
  const imdbId = req.params.id;
  console.log("🔍 SUB REQUEST:", imdbId);

  try {
    // 1️⃣ OMDb → naslov
    const omdb = await fetch(
      `https://www.omdbapi.com/?i=${imdbId}&apikey=thewdb`
    ).then(r => r.json());

    const title = omdb?.Title;
    if (!title) {
      console.log("❌ No title from OMDb");
      return res.json({ subtitles: [] });
    }

    console.log(`🎬 TITLE: ${title}`);

    // 2️⃣ Podnapisi.NET search
    const searchUrl =
      `https://www.podnapisi.net/sl/subtitles/search/?keywords=${encodeURIComponent(title)}&language=sl`;

    const html = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "sl"
      }
    }).then(r => r.text());

    const $ = cheerio.load(html);
    const subtitles = [];

    $("a[href*='/download']").each((i, el) => {
      if (subtitles.length >= 3) return;

      const name = $(el).text().trim();
      const href = $(el).attr("href");
      if (!href) return;

      subtitles.push({
        id: `sl-${i}`,
        lang: "sl",
        name: `🇸🇮 ${name}`,
        url: href.startsWith("http")
          ? href
          : `https://www.podnapisi.net${href}`
      });
    });

    console.log(`✅ RETURNED: ${subtitles.length}`);
    res.json({ subtitles });

  } catch (err) {
    console.error("❌ ERROR:", err.message);
    res.json({ subtitles: [] });
  }
});

/* ================= ROOT ================= */

app.get("/", (req, res) => {
  res.send("Podnapisi.NET FINAL Stremio addon running");
});

/* ================= START ================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log("=======================================");
  console.log("✅ Podnapisi.NET FINAL 🇸🇮 STREMIO READY");
  console.log(`🌐 ${BASE_URL}/manifest.json`);
  console.log("=======================================");
});