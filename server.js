import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());

const BASE = "https://www.podnapisi.net";

app.get("/", (req, res) => {
  res.send("✔ Podnapisi.NET FAST SL running!");
});

app.get("/manifest.json", (req, res) => {
  res.sendFile(process.cwd() + "/manifest.json");
});

app.get("/subtitles/:type/:imdb", async (req, res) => {
  const imdb = req.params.imdb.replace("tt", "");

  const url =
    `${BASE}/sl/subtitles/search/?keywords=&movie_slug=&imdb_id=${imdb}&year=&seasons=&episode=&sub_language=sl&format=&sort=downloads`;

  try {
    const html = await fetch(url).then(r => r.text());
    const $ = cheerio.load(html);

    const subtitles = [];

    $(".table tbody tr").each((i, row) => {
      const link = $(row).find("a").attr("href");
      const title = $(row).find("a").text().trim();

      if (!link) return;

      subtitles.push({
        id: "sl-" + i,
        lang: "sl",
        downloads: 100,
        name: title,
        url: BASE + link
      });
    });

    res.json({ subtitles });
  } catch (e) {
    console.error("Scrape error:", e);
    res.json({ subtitles: [] });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("▶ FAST SL addon listening on port", PORT));
