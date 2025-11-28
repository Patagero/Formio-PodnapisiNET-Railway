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

// Pomagalne funkcije
function normalize(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function parseExtra(extra) {
  // Primeri: "filename=In The Lost Lands (2025) ... .vtt.v2.8wkn6e3e5dfe"
  if (!extra) return {};
  const params = {};
  extra.split("&").forEach(part => {
    const [k, v] = part.split("=");
    if (k) params[k] = decodeURIComponent(v || "");
  });
  return params;
}

// Manifest endpoint
app.get("/manifest.json", (req, res) => {
  res.json(manifest);
});

// Subtitles endpoint
app.get("/subtitles/:type/:id/:extra?.json", async (req, res) => {
  const imdbId = req.params.id;
  const type = req.params.type; // "movie" ali "series"
  const extraRaw = req.params.extra || "";
  const extra = parseExtra(extraRaw);

  console.log("==================================================");
  console.log(`🎬 Zahteva → type=${type}, imdbId=${imdbId}, extra=${extraRaw}`);

  try {
    // 1) Pridobi naslov iz OMDb
    const omdbRes = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=thewdb`);
    const omdbData = await omdbRes.json();
    const title = omdbData?.Title || imdbId;
    const year = (omdbData?.Year || "").replace(/\D+/g, "");
    console.log(`🎬 IMDb → ${title} (${year || "—"})`);

    // 2) Podnapisi.net Search HTML
    const searchUrl = `https://www.podnapisi.net/sl/subtitles/search/?keywords=${encodeURIComponent(title)}&language=sl`;
    console.log(`🌍 Iščem: ${searchUrl}`);

    const html = await (await fetch(searchUrl)).text();
    const $ = load(html);

    // 3) Parsiraj rezultate (glavni selektor in fallback regex)
    const rawResults = [];

    $("table.table tbody tr").each((i, row) => {
      const $row = $(row);
      const link = $row.find("a[href*='/download']").attr("href");
      const name = $row.find("a[href*='/download']").text().trim();
      if (link) {
        rawResults.push({
          index: i + 1,
          link: link.startsWith("http") ? link : `https://www.podnapisi.net${link}`,
          title: name
        });
      }
    });

    // Fallback: regex če tabela ne deluje
    if (rawResults.length === 0) {
      const regex = /href="([^"]*\/download)"[^>]*>([^<]+)<\/a>/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
        const link = match[1].startsWith("http") ? match[1] : `https://www.podnapisi.net${match[1]}`;
        const name = match[2].trim();
        rawResults.push({ index: rawResults.length + 1, link, title: name });
      }
    }

    console.log(`✅ Najdenih: ${rawResults.length}`);

    // 4) Tolerantno filtriranje
    const cleanTitle = normalize(title);
    const filtered = rawResults.filter(r => {
      const t = r.title || "";
      const n = normalize(t);

      const titleOk =
        n.includes(cleanTitle) ||
        n.startsWith(cleanTitle) ||
        (year && n.includes(cleanTitle + year)) ||
        (year && n.includes(cleanTitle) && n.includes(year)) ||
        n.includes(cleanTitle.slice(0, 4)); // rahlo tolerantno

      // Za filme izločimo nekatere tipične neskladne zadetke
      const isWrong = type === "movie" &&
        /(saints|lois|supergirl|series|season|episode|batman)/.test(t.toLowerCase());

      if (!titleOk) console.log(`🚫 Izločen (ni ujemanja): ${t}`);
      if (isWrong) console.log(`🚫 Izločen (napačen za film): ${t}`);

      return titleOk && !isWrong;
    });

    console.log(`🧩 Po filtru: ${filtered.length}`);

    if (filtered.length === 0) {
      return res.json({ subtitles: [] });
    }

    // 5) Sestavi odziv za Stremio
    const subtitles = filtered.map((r, i) => {
      // Uporabi extra.filename, če obstaja, za lepši prikaz
      const displayName = extra.filename
        ? `🇸🇮 ${extra.filename} → ${r.title}`
        : `🇸🇮 ${r.title}`;

      return {
        id: `fast-sl-${i + 1}`,
        url: r.link, // Opomba: Podnapisi download je ZIP. FAST varianta ne razširi ZIP.
        lang: "sl",
        name: displayName
      };
    });

    res.json({ subtitles });
  } catch (err) {
    console.error("⚠️ Napaka:", err.stack || err.message);
    res.json({ subtitles: [] });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("==================================================");
  console.log("✅ FAST Podnapisi.NET 🇸🇮 aktiven");
  console.log(`🌐 Manifest: http://127.0.0.1:${PORT}/manifest.json`);
  console.log("==================================================");
});
