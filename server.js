import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import cheerio from "cheerio";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send("✔ Podnapisi.NET FAST addon running!");
});

// -------- MANIFEST --------
app.get("/manifest.json", (req, res) => {
  res.json({
    id: "podnapisinet-fast-sl",
    version: "1.0.0",
    name: "Podnapisi.NET FAST (SL)",
    description: "Ultrahitri slovenski podnapisi",
    types: ["movie", "series"],
    catalogs: [],
    resources: ["subtitles"],
    idPrefixes: ["tt"]
  });
});

// ------- SUBTITLES HANDLER --------
app.get("/subtitles/:type/:imdbId.json", async (req, res) => {
  const imdbId = req.params.imdbId.replace("tt", "");

  try {
    const url = `https://www.podnapisi.net/subtitles/search/?keywords=&imdb=${imdbId}&language=sl`;
    const html = await fetch(url).then(r => r.text());
    const $ = cheerio.load(html);

    const items = [];

    $(".subtitle-entry").each((i, el) => {
      const title = $(el).find(".release > a").text().trim();
      const link = $(el).find(".download-button").attr("href");

      if (link) {
        items.push({
          id: `podnapisi-${imdbId}-${i}`,
          url: `https://www.podnapisi.net${link}`,
          lang: "sl",
          langShort: "sl",
          title: title || "Slovenski podnapisi"
        });
      }
    });

    res.json({ subtitles: items });
  } catch (err) {
    console.error(err);
    res.json({ subtitles: [] });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Podnapisi.NET FAST listening on port ${PORT}`)
);
