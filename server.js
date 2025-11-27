import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 8080;

// ------------------------------
// MANIFEST
// ------------------------------
const manifest = {
    id: "podnapisinet-sl-fast",
    version: "1.0.0",
    name: "Podnapisi.NET FAST (SL)",
    description: "Fast Slovenian subtitles addon without Puppeteer",
    resources: ["subtitles"],
    types: ["movie", "series"],
    idPrefixes: ["tt"],
    catalogs: []
};

// Manifest route
app.get("/manifest.json", (req, res) => {
    res.json(manifest);
});

// ------------------------------
// FAST SCRAPER
// ------------------------------
async function fetchSubtitles(imdb) {
    const url = `https://www.podnapisi.net/search?keywords=${imdb}&language=sl`;
    const html = await fetch(url).then(res => res.text());
    const $ = cheerio.load(html);

    const results = [];

    $("a[href*='/subtitles/']").each((i, el) => {
        const href = $(el).attr("href");
        const title = $(el).text().trim();

        if (href && title) {
            results.push({
                id: href,
                title,
                url: "https://www.podnapisi.net" + href
            });
        }
    });

    return results;
}

// ------------------------------
// SUBTITLES ENDPOINT
// ------------------------------
app.get("/subtitles/:type/:imdbId.json", async (req, res) => {
    const imdbId = req.params.imdbId;

    try {
        const subs = await fetchSubtitles(imdbId);

        res.json({
            subtitles: subs.map(s => ({
                id: s.id,
                lang: "sl",
                url: s.url,
                title: s.title
            }))
        });
    } catch (err) {
        console.log(err);
        res.json({ subtitles: [] });
    }
});

// ------------------------------
app.get("/", (_, res) => res.send("✓ Podnapisi.NET FAST addon running!"));
// ------------------------------

app.listen(PORT, () =>
    console.log(`🔥 FAST Addon running on ${PORT}`)
);
