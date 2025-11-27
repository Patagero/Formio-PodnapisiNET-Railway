import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 8080;

// Manifest route
app.get("/manifest.json", (req, res) => {
    res.json({
        id: "podnapisinet-sl-fast",
        version: "1.0.0",
        name: "Podnapisi.NET (Fast, SL only)",
        description: "Hitri Stremio addon za slovenske podnapise",
        logo: "https://podnapisi.net/favicon.ico",
        types: ["movie", "series"],
        catalogs: [],
        resources: ["subtitles"],
    });
});

// Subtitles route
app.get("/subtitles/:type/:id.json", async (req, res) => {
    const { type, id } = req.params;

    try {
        // Podnapisi.NET FAST API
        const url = `https://podnapisi.net/subtitles/search/?keywords=${id}&languages=sl`;
        const response = await fetch(url);
        const html = await response.text();

        const subtitles = [];

        // Very fast regex parsing (no cheerio!)
        const regex = /href="\/subtitles\/([\w-]+)".+?class="release">([^<]+)/gs;
        let match;

        while ((match = regex.exec(html)) !== null) {
            subtitles.push({
                id: match[1],
                lang: "sl",
                url: `https://podnapisi.net/subtitles/${match[1]}/download`,
                title: match[2]
            });
        }

        res.json(subtitles);
    } catch (err) {
        console.error(err);
        res.json([]);
    }
});

// Root
app.get("/", (req, res) => {
    res.send("✓ Podnapisi.NET FAST addon running!");
});

app.listen(PORT, () => console.log(`Podnapisi.NET FAST running on ${PORT}`));
