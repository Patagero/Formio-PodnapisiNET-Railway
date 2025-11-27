import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 8080;

app.get("/manifest.json", (req, res) => {
    res.sendFile(new URL("./manifest.json", import.meta.url).pathname);
});

// 🔥 FAST SCRAPER: brez Puppeteer, samo fetch HTML:
async function fetchSubtitles(imdbId) {
    try {
        const url = `https://www.podnapisi.net/sl/subtitles/search/?keywords=&imdbId=${imdbId}&language=sl`;

        const html = await fetch(url).then(r => r.text());

        const regex = /href="\/sl\/subtitles\/(\d+)-[^"]+"/g;
        const ids = [...html.matchAll(regex)].map(m => m[1]);

        if (ids.length === 0) return [];

        return ids.map(id => ({
            id: id,
            url: `https://www.podnapisi.net/sl/subtitles/${id}/download`,
            lang: "sl",
            type: "subtitle",
            name: "Slovenian"
        }));

    } catch (e) {
        console.error("Error scraping:", e);
        return [];
    }
}

app.get("/subtitles/:imdb_id/:type/:extra?.json", async (req, res) => {
    const imdbId = req.params.imdb_id.replace("tt", "");

    const subs = await fetchSubtitles(imdbId);

    res.json({
        subtitles: subs
    });
});

app.get("/", (_, res) => {
    res.send("✔ Podnapisi.NET FAST addon running!");
});

app.listen(PORT, () =>
    console.log("🚀 FAST Podnapisi.NET addon running on port", PORT)
);
