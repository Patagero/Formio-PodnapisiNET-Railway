import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

app.get("/", (req, res) => {
    res.send("✔ Podnapisi.NET FAST addon running!");
});

// MANIFEST
app.get("/manifest.json", (req, res) => {
    res.json({
        id: "podnapisinet-sl-fast",
        version: "1.0.0",
        name: "Podnapisi.NET FAST",
        description: "Hitri slovenski podnapisi",
        types: ["movie", "series"],
        catalogs: [],
        resources: ["subtitles"],
        idPrefixes: ["tt"],
    });
});

// SUBTITLES ROUTE
app.get("/subtitles/:type/:imdbId.json", async (req, res) => {
    const imdb = req.params.imdbId.replace("tt", "");

    try {
        const api = `https://podnapisi.net/subtitles/search/?movie_imdb=${imdb}&languages=sl`;
        const html = await fetch(api).then(r => r.text());

        const results = [];
        const regex = /href="([^"]+download[^"]+)"/g;

        let m;
        while ((m = regex.exec(html)) !== null) {
            results.push({
                id: m[1],
                url: "https://podnapisi.net" + m[1],
                lang: "sl",
                type: "srt"
            });
        }

        res.json({ subtitles: results });
    } catch (err) {
        res.json({ subtitles: [] });
    }
});

// START
app.listen(3000, () => console.log("Addon running on port 3000"));
