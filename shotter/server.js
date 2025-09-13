// server.js
const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 8080;
const TOKEN = process.env.SHOTTER_TOKEN || "";

app.get("/", (_req, res) => res.send("Shotter OK"));
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

app.get("/render", async (req, res) => {
  try {
    if (!TOKEN) return res.status(500).send("ERR: SHOTTER_TOKEN missing");
    if (req.query.token !== TOKEN) return res.status(401).send("ERR: unauthorized");

    const targetUrl = req.query.url;
    const width = parseInt(req.query.w || "1366", 10);
    const height = parseInt(req.query.h || "900", 10);
    const selector = req.query.selector; // opsiyonel

    if (!targetUrl) return res.status(400).send("ERR: url is required");

    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 120000 });

    let png;
    if (selector) {
      await page.waitForSelector(selector, { timeout: 15000 });
      const el = await page.$(selector);
      const box = await el.boundingBox();
      png = await page.screenshot({ type: "png", clip: box });
    } else {
      png = await page.screenshot({ type: "png", fullPage: true });
    }

    await browser.close();
    res.set("Content-Type", "image/png");
    res.send(png);
  } catch (err) {
    console.error(err);
    res.status(500).send(`ERR: ${err.message}`);
  }
});

app.listen(PORT, () => console.log(`Shotter listening on ${PORT}`));
