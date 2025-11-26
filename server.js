import express from "express";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const app = express();

// --- Manifest (preberemo JSON brez assert) ---
const __dirname = path.resolve();
const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, "manifest.json"), "utf8")
);

// --- Glavna API pot ---
app.get("/subtitles", async (req, res) => {
  const query = req.query.query;
  if (!query) return res.json({ subtitles: [] });

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto(`https://www.podnapisi.net/subtitles/search/?q=${query}`);

    // TODO: tvoj scraping tukaj ...

    await browser.close();
    res.json({ subtitles: [] });
  } catch (err) {
    console.error(err);
    res.json({ subtitles: [] });
  }
});

// Manifest endpoints
app.get("/manifest.json", (req, res) => res.json(manifest));
app.get("/", (req, res) => res.redirect("/manifest.json"));

// PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("==============================================");
  console.log(` FORMIO PODNAPISI.NET 🇸🇮 — Running on ${PORT}`);
  console.log("==============================================");
});
