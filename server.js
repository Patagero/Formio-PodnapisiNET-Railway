import express from "express";
import unzipper from "unzipper";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import os from "os";

const app = express();
const PORT = process.env.PORT || 10000;
const BASE_URL = process.env.BASE_URL || "https://formio-podnapisinetv3.onrender.com";

/* ================= MANIFEST ================= */

const manifest = {
  id: "org.podnapisi.final.sl",
  version: "5.0.0",
  name: "Podnapisi.NET 🇸🇮 (FINAL)",
  description: "Slovenski podnapisi iz Podnapisi.NET – razpakirani .srt (Stremio ready)",
  resources: ["subtitles"],
  types: ["movie", "series"],
  idPrefixes: ["tt"]
};

app.get("/manifest.json", (_, res) => {
  res.json(manifest);
});

/* ================= STATIC FILES ================= */

const TMP_DIR = path.join(os.tmpdir(), "podnapisi");
fs.mkdirSync(TMP_DIR, { recursive: true });
app.use("/files", express.static(TMP_DIR));

/* ================= HEADERS ================= */

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  "Accept": "text/html",
  "Accept-Language": "sl-SI,sl;q=0.9,en;q=0.5",
  "Referer": "https://www.podnapisi.net/"
};

/* ================= HELPERS ================= */

function clean(str = "") {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/* ================= SUBTITLES ================= */

app.get("/subtitles/:type/:id.json", async (req, res) => {
  const imdbId = req.params.id;
  console.log("🔍 Stremio request:", imdbId);

  try {
    /* 1️⃣ IMDb → title */
    const omdb = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=thewdb`).then(r => r.json());
    const title = omdb?.Title || imdbId;
    const year = omdb?.Year || "";
    const q = clean(title);

    console.log(`🎬 ${title} (${year})`);

    /* 2️⃣ Podnapisi.NET search */
    const searchUrl =
      `https://www.podnapisi.net/sl/subtitles/search/?keywords=${encodeURIComponent(title)}&language=sl`;

    const html = await fetch(searchUrl, { headers: HEADERS }).then(r => r.text());
    const $ = cheerio.load(html);

    const candidates = [];

    $("a[href*='/download']").each((_, el) => {
      const href = $(el).attr("href");
      const name = $(el).text().trim();
      if (!href) return;

      candidates.push({
        name,
        url: href.startsWith("http") ? href : `https://www.podnapisi.net${href}`
      });
    });

    if (!candidates.length) {
      console.log("❌ No results");
      return res.json({ subtitles: [] });
    }

    /* 3️⃣ Filter */
    const filtered = candidates.filter(s => clean(s.name).includes(q.slice(0, 4)));

    console.log(`✅ Matches: ${filtered.length}`);

    /* 4️⃣ Download + unzip */
    const subtitles = [];

    for (let i = 0; i < Math.min(filtered.length, 3); i++) {
      const sub = filtered[i];
      const zipBuf = await fetch(sub.url).then(r => r.arrayBuffer());

      const dir = path.join(TMP_DIR, `${imdbId}-${i}`);
      fs.mkdirSync(dir, { recursive: true });

      const zip = await unzipper.Open.buffer(Buffer.from(zipBuf));
      const srt = zip.files.find(f => f.path.endsWith(".srt"));
      if (!srt) continue;

      const srtPath = path.join(dir, path.basename(srt.path));
      await new Promise((ok, err) =>
        srt.stream().pipe(fs.createWriteStream(srtPath)).on("finish", ok).on("error", err)
      );

      subtitles.push({
        id: `sl-${i}`,
        lang: "sl",
        format: "srt",
        name: `🇸🇮 ${sub.name}`,
        url: `${BASE_URL}/files/${imdbId}-${i}/${path.basename(srt.path)}`
      });
    }

    console.log(`🎉 Returned: ${subtitles.length}`);
    res.json({ subtitles });

  } catch (e) {
    console.error("❌ ERROR:", e.message);
    res.json({ subtitles: [] });
  }
});

/* ================= ROOT ================= */

app.get("/", (_, res) => {
  res.send("Podnapisi.NET FINAL addon running");
});

/* ================= START ================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log("=======================================");
  console.log("✅ Podnapisi.NET FINAL 🇸🇮 READY");
  console.log(`🌐 ${BASE_URL}/manifest.json`);
  console.log("=======================================");
});