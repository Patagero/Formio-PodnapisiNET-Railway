import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

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

app.get("/manifest.json", (req, res) => {
    res.json(manifest);
});

// ⭐ FAST SCRAPER – brez Puppeteer, HTML fetch
import fetch from "node-fetch";
import cheerio from "cheerio";

app.get("/subtitles/:type/:imdb", async (req, res) => {
    try {
        const imdb = req.params.imdb.replace("tt", "");
        const url = `https://podnapisi.net/subtitles/search/?keywords=${imdb}&language=sl`;

        const html = await fetch(url).then(r => r.text());
        const $ = cheerio.load(html);

        const subtitles = [];

        $(".subtitle-entry").each((i, el) => {
            const id = $(el).attr("data-id");
            const title = $(el).find(".release").text().trim();

            subtitles.push({
                id,
                title,
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

app.get("/", (req, res) => {
    res.send("✔ Podnapisi.NET FAST addon running!<br>Use /manifest.json");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`FAST addon running on ${PORT}`));
