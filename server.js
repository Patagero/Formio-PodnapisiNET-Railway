import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { load } from "cheerio";

const app = express();
app.use(cors());

// ------------------
// MANIFEST
// ------------------
const manifest = {
    id: "podnapisinet-sl-fast",
    version: "1.0.0",
    name: "Podnapisi.NET FAST (SL)",
    description: "Ultra hitri slovenski podnapisi iz Podnapisi.NET",
    types: ["movie", "series"],
    resources: ["subtitles"],
    catalogs: [],
    logo: "https://podnapisi.net/static/img/logo.png",
    behaviorHints: {
        configurable: false,
        configurationRequired: false
    }
};

// manifest.json endpoint
app.get("/manifest.json", (req, res) => {
    res.json(manifest);
});

// ------------------
// SUBTITLES SCRAPER
// ------------------
app.get("/subtitles/:type/:imdb", async (req, res) => {
    try {
        const imdb = req.params.imdb.replace("tt", "");
        const url = `https://podnapisi.net/subtitles/search/?keywords=${imdb}&language=sl`;

        const response = await fetch(url);
        const html = await response.text();

        const $ = load(html);
        const subtitles = [];

        $(".subtitle-entry").each((i, el) => {
            const id = $(el).attr("data-id");
            const title = $(el).find(".release").text().trim();

            if (!id || !title) return;

            subtitles.push({
                id: id,
                title: title,
                lang: "slv",
                url: `https://podnapisi.net/subtitles/${id}/download`
            });
        });

        res.json({ subtitles });

    } catch (err) {
        console.error(err);
        res.json({ subtitles: [] });
    }
});

// ROOT endpoint
app.get("/", (req, res) => {
    res.send("✔ Podnapisi.NET FAST addon running! Use /manifest.json");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`FAST addon running on ${PORT}`));
